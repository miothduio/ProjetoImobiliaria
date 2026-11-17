package com.example.demo.services;

import java.text.NumberFormat;
import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.NovaOfertaDTO;
import com.example.demo.dtos.OfertaDTO;
import com.example.demo.dtos.PaginaDTO;
import com.example.demo.excecoes.AcessoNegadoException;
import com.example.demo.excecoes.DadosInvalidosException;
import com.example.demo.excecoes.NaoEncontradoException;
import com.example.demo.excecoes.RegraNegocioException;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.StatusContrato;
import com.example.demo.models.StatusOferta;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

/**
 * Regras das ofertas:
 *  - só imóvel DISPONÍVEL recebe oferta, e só na finalidade em que ele é anunciado
 *  - o cliente não pode ter duas ofertas em andamento no mesmo imóvel (vários clientes podem)
 *  - aceitar: imóvel RESERVADO e as outras pendentes vão para EM_ESPERA
 *  - recusar uma aceita (antes de haver contrato) desfaz a reserva
 */
@Service
public class OfertaService {

    /** "Em andamento" para a regra de uma oferta por cliente e imóvel. */
    static final Set<StatusOferta> EM_ANDAMENTO = EnumSet.of(StatusOferta.PENDENTE, StatusOferta.EM_ESPERA, StatusOferta.ACEITA);

    /** Contratos que impedem desfazer o aceite (o caminho, nesses casos, é cancelar o contrato). */
    static final Set<StatusContrato> CONTRATO_ATIVO = EnumSet.of(
            StatusContrato.AGUARDANDO_APROVACAO, StatusContrato.AGUARDANDO_ASSINATURA, StatusContrato.ASSINADO);

    private final OfertaRepository repository;
    private final ImovelRepository imovelRepository;
    private final ContratoRepository contratoRepository;
    private final FluxoDoImovel fluxo;
    private final Conversor conversor;
    private final NotificacaoService notificacao;

    public OfertaService(OfertaRepository repository, ImovelRepository imovelRepository,
                         ContratoRepository contratoRepository, FluxoDoImovel fluxo,
                         Conversor conversor, NotificacaoService notificacao) {
        this.repository = repository;
        this.imovelRepository = imovelRepository;
        this.contratoRepository = contratoRepository;
        this.fluxo = fluxo;
        this.conversor = conversor;
        this.notificacao = notificacao;
    }

    // ---------------- Cliente ----------------

    @Transactional
    public OfertaDTO criar(NovaOfertaDTO dto, UserModel cliente) {
        if (!Perfis.ehCliente(cliente)) {
            throw new AcessoNegadoException("Só clientes podem fazer ofertas.");
        }
        ImovelModel imovel = imovelRepository.findById(dto.imovelId())
                .orElseThrow(() -> new NaoEncontradoException("Imóvel não encontrado."));

        if (!ImovelService.estaDisponivel(imovel)) {
            throw new RegraNegocioException("Este imóvel não está disponível para ofertas"
                    + (imovel.getStatus() != null ? " (situação: " + imovel.getStatus().toLowerCase(Locale.ROOT) + ")" : "") + ".");
        }

        String tipo = ImovelService.normalizar(dto.tipo());
        if (!tipo.equals("VENDA") && !tipo.equals("ALUGUEL")) {
            throw new DadosInvalidosException("Tipo inválido. Use VENDA ou ALUGUEL.");
        }
        if (!ImovelService.oferecePara(imovel, tipo)) {
            throw new RegraNegocioException("Este imóvel não está anunciado para " + (tipo.equals("VENDA") ? "venda" : "aluguel") + ".");
        }
        if (repository.existsByImovelIdAndUsuarioIdAndStatusIn(imovel.getId(), cliente.getId(), EM_ANDAMENTO)) {
            throw new RegraNegocioException("Você já tem uma oferta em andamento para este imóvel. Acompanhe em Minhas ofertas.");
        }

        OfertaModel oferta = new OfertaModel();
        oferta.setImovel(imovel);
        oferta.setUsuario(cliente);
        oferta.setTipo(tipo);
        oferta.setValor(dto.valor());
        oferta.setMensagem(dto.mensagem() == null || dto.mensagem().isBlank() ? null : dto.mensagem().trim());
        oferta.setStatus(StatusOferta.PENDENTE);
        return conversor.oferta(repository.save(oferta));
    }

    @Transactional
    public OfertaDTO cancelarPeloCliente(Integer id, UserModel cliente) {
        OfertaModel oferta = daPessoa(id, cliente);
        if (oferta.getStatus() == StatusOferta.ACEITA) {
            throw new RegraNegocioException("Esta oferta já foi aceita. Para desistir, fale com a imobiliária: "
                    + "o contrato precisa ser cancelado pelo administrador.");
        }
        if (oferta.getStatus() != StatusOferta.PENDENTE && oferta.getStatus() != StatusOferta.EM_ESPERA) {
            throw new RegraNegocioException("Esta oferta já está " + rotulo(oferta.getStatus()) + ".");
        }
        oferta.setStatus(StatusOferta.CANCELADA);
        return conversor.oferta(repository.save(oferta));
    }

    @Transactional(readOnly = true)
    public PaginaDTO<OfertaDTO> listarDoCliente(UserModel cliente, String status, Integer imovelId, int pagina, int tamanho) {
        StatusOferta filtro = Paginas.status(status, StatusOferta.class);
        Pageable pedido = Paginas.pedido(pagina, tamanho);
        Page<OfertaModel> resultado;
        if (imovelId != null) {
            resultado = repository.findByUsuarioIdAndImovelId(cliente.getId(), imovelId, pedido);
        } else if (filtro != null) {
            resultado = repository.findByUsuarioIdAndStatus(cliente.getId(), filtro, pedido);
        } else {
            resultado = repository.findByUsuarioId(cliente.getId(), pedido);
        }
        return Paginas.converter(resultado, conversor::oferta);
    }

    // ---------------- Corretor / Admin ----------------

    @Transactional(readOnly = true)
    public PaginaDTO<OfertaDTO> listarTodas(String status, Integer imovelId, int pagina, int tamanho) {
        StatusOferta filtro = Paginas.status(status, StatusOferta.class);
        Pageable pedido = Paginas.pedido(pagina, tamanho);
        Page<OfertaModel> resultado;
        if (imovelId != null && filtro != null) {
            resultado = repository.findByImovelIdAndStatus(imovelId, filtro, pedido);
        } else if (imovelId != null) {
            resultado = repository.findByImovelId(imovelId, pedido);
        } else if (filtro != null) {
            resultado = repository.findByStatus(filtro, pedido);
        } else {
            resultado = repository.findAll(pedido);
        }
        return Paginas.converter(resultado, conversor::oferta);
    }

    @Transactional
    public OfertaDTO aceitar(Integer id, UserModel ator) {
        exigirEquipe(ator);
        OfertaModel oferta = buscar(id);
        if (oferta.getStatus() != StatusOferta.PENDENTE) {
            throw new RegraNegocioException("Só ofertas pendentes podem ser aceitas. Esta está " + rotulo(oferta.getStatus()) + ".");
        }
        if (!ImovelService.estaDisponivel(oferta.getImovel())) {
            throw new RegraNegocioException("O imóvel não está mais disponível (já há outra oferta aceita ou ele foi negociado).");
        }

        oferta.setStatus(StatusOferta.ACEITA);
        repository.save(oferta);
        fluxo.reservar(oferta);

        notificacao.avisarCliente(oferta.getUsuario(),
                "Sua oferta foi aceita",
                "Boa notícia: sua oferta foi aceita!",
                "O imóvel ficou reservado para você. Agora o corretor prepara o contrato; quando ele for aprovado, "
                        + "você recebe outro aviso para assinar.",
                resumo(oferta), "Ver minhas ofertas", "/cliente/ofertas");
        return conversor.oferta(oferta);
    }

    @Transactional
    public OfertaDTO recusar(Integer id, UserModel ator) {
        exigirEquipe(ator);
        OfertaModel oferta = buscar(id);
        StatusOferta antes = oferta.getStatus();

        if (antes == StatusOferta.ACEITA) {
            if (contratoRepository.existsByOfertaIdAndStatusIn(oferta.getId(), CONTRATO_ATIVO)) {
                throw new RegraNegocioException("Esta oferta já tem contrato. Para desfazer, o administrador cancela o contrato.");
            }
        } else if (antes != StatusOferta.PENDENTE && antes != StatusOferta.EM_ESPERA) {
            throw new RegraNegocioException("Esta oferta já está " + rotulo(antes) + ".");
        }

        oferta.setStatus(StatusOferta.RECUSADA);
        repository.save(oferta);
        if (antes == StatusOferta.ACEITA) {
            fluxo.liberar(oferta.getImovel());   // desfaz a reserva
        }

        notificacao.avisarCliente(oferta.getUsuario(),
                "Sua oferta não foi aceita",
                "Sua oferta não foi aceita",
                "Desta vez a proposta não foi aceita. Você pode fazer uma nova oferta enquanto o imóvel estiver disponível.",
                resumo(oferta), "Ver minhas ofertas", "/cliente/ofertas");
        return conversor.oferta(oferta);
    }

    // ---------------- Apoio ----------------

    private OfertaModel buscar(Integer id) {
        return repository.findById(id).orElseThrow(() -> new NaoEncontradoException("Oferta não encontrada."));
    }

    /** Oferta de outra pessoa responde 404, como se não existisse (não revela que o id existe). */
    private OfertaModel daPessoa(Integer id, UserModel cliente) {
        OfertaModel oferta = buscar(id);
        if (!oferta.getUsuario().getId().equals(cliente.getId())) {
            throw new NaoEncontradoException("Oferta não encontrada.");
        }
        return oferta;
    }

    private static void exigirEquipe(UserModel ator) {
        if (!Perfis.ehEquipe(ator)) {
            throw new AcessoNegadoException("Só corretores e administradores atendem ofertas.");
        }
    }

    static String rotulo(StatusOferta s) {
        return switch (s) {
            case PENDENTE -> "pendente";
            case ACEITA -> "aceita";
            case EM_ESPERA -> "em espera";
            case RECUSADA -> "recusada";
            case CANCELADA -> "cancelada";
        };
    }

    static String resumo(OfertaModel o) {
        String valor = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"))
                .format(o.getValor() == null ? BigDecimal.ZERO : o.getValor());
        return "Imóvel cód. " + o.getImovel().getId() + ": " + o.getImovel().getTitulo() + "\n"
                + ("ALUGUEL".equals(o.getTipo()) ? "Aluguel: " + valor + "/mês" : "Compra: " + valor);
    }
}
