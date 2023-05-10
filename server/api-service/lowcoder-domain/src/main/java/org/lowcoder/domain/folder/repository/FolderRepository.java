package org.lowcoder.domain.folder.repository;

import org.lowcoder.domain.folder.model.Folder;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;

@Repository
public interface FolderRepository extends ReactiveMongoRepository<Folder, String> {

    Flux<Folder> findByOrganizationId(String organizationId);
}
