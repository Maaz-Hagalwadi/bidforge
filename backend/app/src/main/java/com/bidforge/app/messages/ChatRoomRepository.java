package com.bidforge.app.messages;

import com.bidforge.app.contract.Contract;
import com.bidforge.app.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    Optional<ChatRoom> findByContract(Contract contract);

    List<ChatRoom> findByClientOrFreelancer(User client, User freelancer);
}


