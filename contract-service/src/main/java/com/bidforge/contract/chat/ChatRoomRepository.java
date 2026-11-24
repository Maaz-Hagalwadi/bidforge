package com.bidforge.contract.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    Optional<ChatRoom> findByContractId(UUID contractId);

    List<ChatRoom> findByClientIdOrFreelancerId(Long clientId, Long freelancerId);
}
