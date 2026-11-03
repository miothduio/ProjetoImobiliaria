package com.example.demo.services;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;


@Service 
public class FotoImovelService {

    @Autowired 
    private FotoImovelRepository fotoImovelRepository;
    
    @Autowired 
    private ImovelRepository imovelRepository;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public FotoImovelModel salvar(MultipartFile arquivo, Integer imovelId) {
        ImovelModel imovel = imovelRepository.findById(imovelId)
            .orElseThrow(() -> new NoSuchElementException("Imóvel não encontrado: " + imovelId));

        if (arquivo.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        try {
            //2 -> criar o dir de uploads
            Path pasta = Paths.get(uploadDir, String.valueOf(imovelId));
            Files.createDirectories(pasta);

            //3 -> renomear e mover o arquivo
            String nomeOriginal = StringUtils.cleanPath(arquivo.getOriginalFilename());
            String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
            Path destino = pasta.resolve(nomeFinal).normalize();

            if (!destino.startsWith(pasta.normalize())) {
                throw new IllegalArgumentException("Nome de arquivo inválido");
            }

            arquivo.transferTo(destino);

            //4 -> criar o modelo e salvar
            FotoImovelModel model = new FotoImovelModel();
            model.setCaminho(destino.toString());
            model.setNomeArquivo(nomeFinal);
            // imovel_id é NOT NULL no banco: sem este vínculo o insert falha
            model.setImovel(imovel);

            // a primeira foto do imóvel vira a capa; as demais vão para o fim da fila
            List<FotoImovelModel> existentes = listarPorImovel(imovelId);
            model.setCapa(existentes.isEmpty());
            model.setOrdem(existentes.size() + 1);

            return fotoImovelRepository.save(model);
        }
        catch (IOException e) {
            throw new UncheckedIOException("Falha ao salvar o arquivo", e);
        }
    }

    public List<FotoImovelModel> listarPorImovel(Integer imovelId) {
        return fotoImovelRepository.findByImovelIdOrderByOrdemAscIdAsc(imovelId);
    }

    public FotoImovelModel buscar(Integer id) {
        return fotoImovelRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Foto não encontrada: " + id));
    }

    // atualiza a ordem e/ou troca o arquivo; o que vier nulo/vazio fica como está
    public FotoImovelModel atualizar(Integer id, Integer ordem, MultipartFile arquivo) {
        FotoImovelModel foto = buscar(id);

        if (ordem != null) {
            foto.setOrdem(ordem);
        }

        if (arquivo != null && !arquivo.isEmpty()) {
            try {
                Path pasta = Paths.get(uploadDir, String.valueOf(foto.getImovel().getId()));
                Files.createDirectories(pasta);

                String nomeOriginal = StringUtils.cleanPath(arquivo.getOriginalFilename());
                String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
                Path destino = pasta.resolve(nomeFinal).normalize();

                if (!destino.startsWith(pasta.normalize())) {
                    throw new IllegalArgumentException("Nome de arquivo inválido");
                }

                arquivo.transferTo(destino);
                Files.deleteIfExists(Paths.get(foto.getCaminho()));

                foto.setCaminho(destino.toString());
                foto.setNomeArquivo(nomeFinal);
            }
            catch (IOException e) {
                throw new UncheckedIOException("Falha ao salvar o arquivo", e);
            }
        }

        return fotoImovelRepository.save(foto);
    }

    public void excluir(Integer id) {
        FotoImovelModel foto = buscar(id);

        try {
            Files.deleteIfExists(Paths.get(foto.getCaminho()));
        }
        catch (IOException e) {
            throw new UncheckedIOException("Falha ao apagar o arquivo", e);
        }

        fotoImovelRepository.delete(foto);
    }

    // só uma foto por imóvel pode ser a capa
    @Transactional
    public FotoImovelModel definirCapa(Integer id) {
        FotoImovelModel foto = buscar(id);

        for (FotoImovelModel outra : listarPorImovel(foto.getImovel().getId())) {
            outra.setCapa(outra.getId().equals(id));
        }

        return foto;
    }

}