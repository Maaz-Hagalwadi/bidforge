package com.bidforge.app.contract;

import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.ContractNotFoundException;
import com.bidforge.app.contract.dto.ContractResponse;
import com.bidforge.app.contract.dto.RevisionRequest;
import com.bidforge.app.contract.dto.SubmitWorkRequest;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.user.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;



    public List<ContractResponse> getClientContracts(User client) {
        return contractRepository.findByClientId(client.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ContractResponse> getFreelancerContracts(User freelancer) {
        return contractRepository.findByFreelancerId(freelancer.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void completeContract(UUID contractId, User client) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        // 🔒 Only client
        if (!contract.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this contract");
        }

        // 🔒 Only SUBMITTED contracts
        if (contract.getStatus() != ContractStatus.SUBMITTED) {
            throw new IllegalStateException("Work not submitted yet");
        }

        // ✅ Complete
        contract.setStatus(ContractStatus.COMPLETED);
        contractRepository.save(contract);

        // 🔥 Update job
        Job job = contract.getJob();
        job.setStatus(JobStatus.COMPLETED);
    }

    @Transactional
    public void requestRevision(UUID contractId, RevisionRequest request, User client) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        // 🔒 Only client
        if (!contract.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this contract");
        }

        // 🔒 Only after submission
        if (contract.getStatus() != ContractStatus.SUBMITTED) {
            throw new IllegalStateException("Work must be submitted first");
        }

        // ✅ Save feedback
        contract.setRevisionNote(request.getNote());
        contract.setRevisionRequestedAt(LocalDateTime.now());

        // ✅ Update status
        contract.setStatus(ContractStatus.REVISION_REQUESTED);
        contractRepository.save(contract);
    }


    @Transactional
    public void submitWork(UUID contractId, SubmitWorkRequest request, User freelancer) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        // 🔒 Only assigned freelancer
        if (!contract.getFreelancer().getId().equals(freelancer.getId())) {
            throw new AccessDeniedException("You are not assigned to this contract");
        }

        // 🔒 ACTIVE or REVISION_REQUESTED
        if (contract.getStatus() != ContractStatus.ACTIVE &&
                contract.getStatus() != ContractStatus.REVISION_REQUESTED) {
            throw new IllegalStateException("Cannot submit at this stage");
        }

        // ✅ Save submission details
        contract.setSubmissionNote(request.getSubmissionNote());
        contract.setSubmissionUrl(request.getSubmissionUrl());
        contract.setSubmittedAt(LocalDateTime.now());

        contract.setRevisionNote(null);
        contract.setRevisionRequestedAt(null);


        // ✅ Move status
        contract.setStatus(ContractStatus.SUBMITTED);

        contractRepository.save(contract);
    }


    private ContractResponse mapToResponse(Contract c) {
        String deadline = c.getJob().getDeadline() != null
                ? c.getJob().getDeadline().toLocalDate().toString()
                : null;
        return ContractResponse.builder()
                .id(c.getId())
                .jobId(c.getJob().getId())
                .clientId(c.getClient().getId())
                .freelancerId(c.getFreelancer().getId())
                .amount(c.getAgreedAmount())
                .status(c.getStatus())
                .submissionNote(c.getSubmissionNote())
                .submissionUrl(c.getSubmissionUrl())
                .submittedAt(c.getSubmittedAt())
                .createdAt(c.getCreatedAt())
                .jobTitle(c.getJob().getTitle())
                .deadline(deadline)
                .clientName(c.getClient().getName())
                .freelancerName(c.getFreelancer().getName())
                .deliveryDays(c.getDeliveryDays())
                .revisionNote(c.getRevisionNote())
                .revisionRequestedAt(c.getRevisionRequestedAt())
                .build();
    }
}
