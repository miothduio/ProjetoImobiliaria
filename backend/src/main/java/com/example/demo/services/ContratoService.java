package com.example.demo.services;

import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.AssinaturaDTO;
import com.example.demo.dtos.ContratoDTO;
import com.example.demo.dtos.PaginaDTO;
import com.example.demo.excecoes.AcessoNegadoException;
import com.example.demo.excecoes.DadosInvalidosException;
import com.example.demo.excecoes.NaoEncontradoException;
import com.example.demo.excecoes.RegraNegocioException;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.StatusContrato;
import com.example.demo.models.StatusOferta;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.OfertaRepository;

/**
 * Fluxo do contrato:
 *   corretor prepara (PDF enviado ou gerado) -> AGUARDANDO_APROVACAO
 *   admin aprova                            -> AGUARDANDO_ASSINATURA (cliente recebe e-mail)
 *   admin recusa                            -> RECUSADO (o corretor prepara outro para a mesma oferta)
 *   cliente assina                          -> ASSINADO: imóvel ALUGADO/VENDIDO, demais ofertas RECUSADAS
 *   admin cancela (cliente desistiu)        -> CANCELADO: oferta CANCELADA e imóvel DISPONÍVEL de novo
 */
@Service
public class ContratoService {

    private final ContratoRepository repository;
    private final OfertaRepository ofertaRepository;
    private final FluxoDoImovel fluxo;
    private final ArquivosDeContrato arquivos;
    private final Conversor conversor;
    private final NotificacaoService notificacao;

    public ContratoService(ContratoRepository repository, OfertaRepository ofertaRepository, FluxoDoImovel fluxo,
                           ArquivosDeContrato arquivos, Conversor conversor, NotificacaoService notificacao) {
        this.repository = repository;
        this.ofertaRepository = ofertaRepository;
        this.fluxo = fluxo;
        this.arquivos = arquivos;
        this.conversor = conversor;
        this.notificacao = notificacao;
    }

    // ---------------- Corretor / Admin ----------------

    /**
     * Prepara o contrato de uma oferta aceita.
     * Com "arquivo": usa o PDF enviado pelo corretor. Sem arquivo: o sistema gera o PDF a partir da oferta.
     */
    @Transactional
    public ContratoDTO preparar(Integer ofertaId, MultipartFile arquivo, UserModel ator) {
        if (!Perfis.ehEquipe(ator)) {
            throw new AcessoNegadoException("Só corretores e administradores preparam contratos.");
        }
        if (ofertaId == null) {
            throw new DadosInvalidosException("Informe a oferta.");
        }
        OfertaModel oferta = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new NaoEncontradoException("Oferta não encontrada."));
        if (oferta.getStatus() != StatusOferta.ACEITA) {
            throw new RegraNegocioException("Só ofertas aceitas recebem contrato. Esta está " + OfertaService.rotulo(oferta.getStatus()) + ".");
        }
        if (repository.existsByOfertaIdAndStatusIn(ofertaId, OfertaService.CONTRATO_ATIVO)) {
            throw new RegraNegocioException("Esta oferta já tem um contrato em andamento.");
        }

        byte[] enviado = lerPdfEnviado(arquivo);

        ContratoModel contrato = new ContratoModel();
        contrato.setOferta(oferta);
        contrato.setStatus(StatusContrato.AGUARDANDO_APROVACAO);
        contrato.setPreparadoPor(ator);
        contrato.setPdfGerado(enviado == null);
        contrato = repository.save(contrato);   // precisa do id para o nome do arquivo e para o texto do PDF

        byte[] pdf = enviado != null ? enviado : ContratoPdf.gerar(contrato);
        contrato.setPdfCaminho(arquivos.salvar(contrato.getId(), pdf));
        contrato.setPdfNome(enviado != null && arquivo.getOriginalFilename() != null && !arquivo.getOriginalFilename().isBlank()
                ? arquivo.getOriginalFilename().replaceAll("[\\\\/:*?\"<>|]", "_")
                : "contrato-" + contrato.getId() + ".pdf");
        return conversor.contrato(repository.save(contrato));
    }

    @Transactional(readOnly = true)
    public PaginaDTO<ContratoDTO> listarTodos(String status, int pagina, int tamanho) {
        StatusContrato filtro = Paginas.status(status, StatusContrato.class);
        Pageable pedido = Paginas.pedido(pagina, tamanho);
        Page<ContratoModel> resultado = filtro == null ? repository.findAll(pedido) : repository.findByStatus(filtro, pedido);
        return Paginas.converter(resultado, conversor::contrato);
    }

    @Transactional
    public ContratoDTO aprovar(Integer id, UserModel admin) {
        exigirAdmin(admin);
        ContratoModel contrato = buscar(id);
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_APROVACAO) {
            throw new RegraNegocioException("Só contratos aguardando aprovação podem ser aprovados. Este está " + rotulo(contrato.getStatus()) + ".");
        }
        contrato.setStatus(StatusContrato.AGUARDANDO_ASSINATURA);
        contrato.setDataAprovacao(LocalDateTime.now());
        contrato.setMotivo(null);
        regerarSeFoiGerado(contrato);
        repository.save(contrato);

        notificacao.avisarCliente(contrato.getOferta().getUsuario(),
                "Seu contrato está pronto para assinar",
                "Seu contrato foi aprovado",
                "O contrato da sua oferta foi aprovado pela administração. Entre na sua área do cliente, confira o PDF e assine.",
                OfertaService.resumo(contrato.getOferta()), "Assinar contrato", "/cliente/contratos");
        return conversor.contrato(contrato);
    }

    @Transactional
    public ContratoDTO recusar(Integer id, String motivo, UserModel admin) {
        exigirAdmin(admin);
        ContratoModel contrato = buscar(id);
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_APROVACAO) {
            throw new RegraNegocioException("Só contratos aguardando aprovação podem ser recusados. Este está " + rotulo(contrato.getStatus()) + ".");
        }
        contrato.setStatus(StatusContrato.RECUSADO);
        contrato.setMotivo(limpar(motivo));
        repository.save(contrato);

        notificacao.avisarCliente(contrato.getOferta().getUsuario(),
                "Seu contrato está em revisão",
                "Seu contrato está sendo revisado",
                "A administração pediu ajustes no contrato da sua oferta. A reserva do imóvel continua valendo e "
                        + "você recebe um novo aviso quando a versão corrigida for aprovada.",
                OfertaService.resumo(contrato.getOferta()), "Ver meus contratos", "/cliente/contratos");
        return conversor.contrato(contrato);
    }

    /** Cliente desistiu: cancela o contrato e devolve o imóvel para a vitrine. */
    @Transactional
    public ContratoDTO cancelar(Integer id, String motivo, UserModel admin) {
        exigirAdmin(admin);
        ContratoModel contrato = buscar(id);
        if (contrato.getStatus() == StatusContrato.ASSINADO) {
            throw new RegraNegocioException("Contrato assinado não pode ser cancelado por aqui.");
        }
        if (contrato.getStatus() == StatusContrato.CANCELADO || contrato.getStatus() == StatusContrato.RECUSADO) {
            throw new RegraNegocioException("Este contrato já está " + rotulo(contrato.getStatus()) + ".");
        }
        contrato.setStatus(StatusContrato.CANCELADO);
        contrato.setMotivo(limpar(motivo));
        repository.save(contrato);

        OfertaModel oferta = contrato.getOferta();
        oferta.setStatus(StatusOferta.CANCELADA);
        ofertaRepository.save(oferta);
        fluxo.liberar(oferta.getImovel());

        notificacao.avisarCliente(oferta.getUsuario(),
                "Seu contrato foi cancelado",
                "Seu contrato foi cancelado",
                "O contrato da sua oferta foi cancelado e o imóvel voltou a ficar disponível. Se foi um engano, fale com a imobiliária.",
                OfertaService.resumo(oferta), "Ver meus contratos", "/cliente/contratos");
        return conversor.contrato(contrato);
    }

    // ---------------- Cliente ----------------

    @Transactional(readOnly = true)
    public PaginaDTO<ContratoDTO> listarDoCliente(UserModel cliente, String status, int pagina, int tamanho) {
        StatusContrato filtro = Paginas.status(status, StatusContrato.class);
        Pageable pedido = Paginas.pedido(pagina, tamanho);
        Page<ContratoModel> resultado = filtro == null
                ? repository.findByOfertaUsuarioId(cliente.getId(), pedido)
                : repository.findByOfertaUsuarioIdAndStatus(cliente.getId(), filtro, pedido);
        return Paginas.converter(resultado, conversor::contrato);
    }

    @Transactional
    public ContratoDTO assinar(Integer id, AssinaturaDTO dto, UserModel cliente) {
        ContratoModel contrato = buscar(id);
        if (!Perfis.ehCliente(cliente) || !contrato.getOferta().getUsuario().getId().equals(cliente.getId())) {
            throw new NaoEncontradoException("Contrato não encontrado.");
        }
        if (contrato.getStatus() == StatusContrato.AGUARDANDO_APROVACAO) {
            throw new RegraNegocioException("Este contrato ainda não foi aprovado pela administração.");
        }
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new RegraNegocioException("Este contrato está " + rotulo(contrato.getStatus()) + " e não pode ser assinado.");
        }
        if (dto == null || !Boolean.TRUE.equals(dto.aceite())) {
            throw new DadosInvalidosException("Confirme que leu o contrato antes de assinar.");
        }
        String nome = dto.nome() == null ? "" : dto.nome().trim().replaceAll("\\s+", " ");
        if (nome.isEmpty()) {
            throw new DadosInvalidosException("Digite seu nome completo para assinar.");
        }
        String cadastro = cliente.getNome();
        if (cadastro != null && !cadastro.isBlank()
                && !ImovelService.normalizar(cadastro).replaceAll("\\s+", " ").equals(ImovelService.normalizar(nome))) {
            throw new DadosInvalidosException("O nome digitado precisa ser igual ao do cadastro: " + cadastro.trim() + ".");
        }

        contrato.setStatus(StatusContrato.ASSINADO);
        contrato.setDataAssinatura(LocalDateTime.now());
        contrato.setAssinadoComo(nome);
        regerarSeFoiGerado(contrato);
        repository.save(contrato);

        fluxo.concluir(contrato.getOferta());
        return conversor.contrato(contrato);
    }

    // ---------------- PDF ----------------

    /** Equipe baixa qualquer PDF; o cliente, só os dele (os outros respondem 404). */
    @Transactional(readOnly = true)
    public ArquivoPdf pdf(Integer id, UserModel usuario) {
        ContratoModel contrato = buscar(id);
        boolean dono = contrato.getOferta().getUsuario().getId().equals(usuario.getId());
        if (!Perfis.ehEquipe(usuario) && !dono) {
            throw new NaoEncontradoException("Contrato não encontrado.");
        }
        byte[] conteudo = arquivos.ler(contrato.getPdfCaminho());
        if (conteudo == null) {
            throw new NaoEncontradoException("O arquivo deste contrato não foi encontrado no servidor.");
        }
        return new ArquivoPdf(contrato.getPdfNome() != null ? contrato.getPdfNome() : "contrato-" + id + ".pdf", conteudo);
    }

    public record ArquivoPdf(String nome, byte[] conteudo) {}

    // ---------------- Apoio ----------------

    private ContratoModel buscar(Integer id) {
        return repository.findById(id).orElseThrow(() -> new NaoEncontradoException("Contrato não encontrado."));
    }

    private static void exigirAdmin(UserModel u) {
        if (!Perfis.ehAdmin(u)) {
            throw new AcessoNegadoException("Só o administrador aprova, recusa ou cancela contratos.");
        }
    }

    /** O PDF gerado pelo sistema é refeito para registrar aprovação e assinatura; o enviado pelo corretor fica como está. */
    private void regerarSeFoiGerado(ContratoModel contrato) {
        if (!Boolean.TRUE.equals(contrato.getPdfGerado())) return;
        String antigo = contrato.getPdfCaminho();
        contrato.setPdfCaminho(arquivos.salvar(contrato.getId(), ContratoPdf.gerar(contrato)));
        arquivos.apagar(antigo);
    }

    private static byte[] lerPdfEnviado(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) return null;
        try {
            byte[] bytes = arquivo.getBytes();
            if (!ArquivosDeContrato.pareceUmPdf(bytes)) {
                throw new DadosInvalidosException("O arquivo enviado não é um PDF.");
            }
            return bytes;
        } catch (IOException e) {
            throw new DadosInvalidosException("Não foi possível ler o arquivo enviado.");
        }
    }

    private static String limpar(String motivo) {
        if (motivo == null || motivo.isBlank()) return null;
        String m = motivo.trim();
        return m.length() > 1000 ? m.substring(0, 1000) : m;
    }

    static String rotulo(StatusContrato s) {
        return switch (s) {
            case AGUARDANDO_APROVACAO -> "aguardando aprovação";
            case AGUARDANDO_ASSINATURA -> "aguardando assinatura";
            case ASSINADO -> "assinado";
            case RECUSADO -> "recusado";
            case CANCELADO -> "cancelado";
        };
    }

}
