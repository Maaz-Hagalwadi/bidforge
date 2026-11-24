package com.bidforge.contract.contract;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.clients.JobServiceClient;
import com.bidforge.contract.kafka.KafkaNotificationProducer;
import com.bidforge.contract.common.exception.AccessDeniedException;
import com.bidforge.contract.common.exception.ContractNotFoundException;
import com.bidforge.contract.contract.dto.ContractResponse;
import com.bidforge.contract.contract.dto.CreateContractRequest;
import com.bidforge.contract.contract.dto.RevisionRequest;
import com.bidforge.contract.contract.dto.SubmitWorkRequest;
import com.bidforge.contract.review.ReviewRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final KafkaNotificationProducer kafkaNotificationProducer;
    private final JobServiceClient jobServiceClient;
    private final ReviewRepository reviewRepository;

    // Called by POST /internal/contracts — triggered by job-service when a bid is accepted
    // This is the key pattern: job-service → HTTP POST → contract-service creates the contract
    @Transactional
    public ContractResponse createContract(CreateContractRequest req) {
        if (contractRepository.existsByJobId(req.getJobId())) {
            return mapToResponse(contractRepository.findByJobId(req.getJobId()).get());
        }

        Contract contract = Contract.builder()
                .jobId(req.getJobId())
                .jobTitle(req.getJobTitle())
                .clientId(req.getClientId())
                .clientEmail(req.getClientEmail())
                .clientName(req.getClientName())
                .freelancerId(req.getFreelancerId())
                .freelancerEmail(req.getFreelancerEmail())
                .freelancerName(req.getFreelancerName())
                .agreedAmount(req.getAgreedAmount())
                .deliveryDays(req.getDeliveryDays())
                .status(ContractStatus.ACTIVE)
                .build();

        Contract saved = contractRepository.save(contract);
        log.info("Contract created: contractId={}, jobId={}, freelancerId={}", saved.getId(), req.getJobId(), req.getFreelancerId());

        kafkaNotificationProducer.send(
                req.getFreelancerId(), req.getFreelancerEmail(),
                "Contract Created",
                "A contract has been created for \"" + req.getJobTitle() + "\".",
                "CONTRACT_CREATED",
                saved.getId()
        );
        kafkaNotificationProducer.send(
                req.getClientId(), req.getClientEmail(),
                "Contract Created",
                "Contract created with freelancer for \"" + req.getJobTitle() + "\".",
                "CONTRACT_CREATED",
                saved.getId()
        );

        return mapToResponse(saved);
    }

    public List<ContractResponse> getClientContracts(UserInfo client) {
        return contractRepository.findByClientId(client.id())
                .stream().map(this::mapToResponse).toList();
    }

    public List<ContractResponse> getFreelancerContracts(UserInfo freelancer) {
        return contractRepository.findByFreelancerId(freelancer.id())
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void submitWork(UUID contractId, SubmitWorkRequest request, UserInfo freelancer) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        if (!contract.getFreelancerId().equals(freelancer.id())) {
            throw new AccessDeniedException("You are not assigned to this contract");
        }

        if (contract.getStatus() != ContractStatus.ACTIVE &&
                contract.getStatus() != ContractStatus.REVISION_REQUESTED) {
            throw new IllegalStateException("Cannot submit at this stage");
        }

        contract.setSubmissionNote(request.getSubmissionNote());
        contract.setSubmissionUrl(request.getSubmissionUrl());
        contract.setSubmittedAt(LocalDateTime.now());
        contract.setRevisionNote(null);
        contract.setRevisionRequestedAt(null);
        contract.setStatus(ContractStatus.SUBMITTED);
        contractRepository.save(contract);

        log.info("Work submitted: contractId={}, freelancerId={}", contractId, freelancer.id());

        kafkaNotificationProducer.send(
                contract.getClientId(), contract.getClientEmail(),
                "Work Submitted",
                "Freelancer submitted work for review on \"" + contract.getJobTitle() + "\".",
                "CONTRACT_SUBMITTED",
                contractId
        );
    }

    @Transactional
    public void completeContract(UUID contractId, UserInfo client) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        if (!contract.getClientId().equals(client.id())) {
            throw new AccessDeniedException("You do not own this contract");
        }

        if (contract.getStatus() != ContractStatus.SUBMITTED) {
            throw new IllegalStateException("Work not submitted yet");
        }

        contract.setStatus(ContractStatus.COMPLETED);
        contractRepository.save(contract);
        log.info("Contract completed: contractId={}, jobId={}", contractId, contract.getJobId());

        // Key learning: contract-service tells job-service to mark the job COMPLETED
        // This is the reverse direction: contract-service → HTTP PATCH → job-service
        jobServiceClient.markJobCompleted(contract.getJobId());

        kafkaNotificationProducer.send(
                contract.getFreelancerId(), contract.getFreelancerEmail(),
                "Contract Completed",
                "Congratulations! \"" + contract.getJobTitle() + "\" has been completed.",
                "CONTRACT_COMPLETED",
                contractId
        );
    }

    @Transactional
    public void requestRevision(UUID contractId, RevisionRequest request, UserInfo client) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        if (!contract.getClientId().equals(client.id())) {
            throw new AccessDeniedException("You do not own this contract");
        }

        if (contract.getStatus() != ContractStatus.SUBMITTED) {
            throw new IllegalStateException("Work must be submitted first");
        }

        contract.setRevisionNote(request.getNote());
        contract.setRevisionRequestedAt(LocalDateTime.now());
        contract.setStatus(ContractStatus.REVISION_REQUESTED);
        contractRepository.save(contract);
        log.info("Revision requested: contractId={}", contractId);

        kafkaNotificationProducer.send(
                contract.getFreelancerId(), contract.getFreelancerEmail(),
                "Revision Requested",
                "Client requested revisions on \"" + contract.getJobTitle() + "\".",
                "REVISION_REQUESTED",
                contractId
        );
    }

    public ContractResponse mapToResponse(Contract c) {
        return ContractResponse.builder()
                .id(c.getId())
                .jobId(c.getJobId())
                .clientId(c.getClientId())
                .freelancerId(c.getFreelancerId())
                .amount(c.getAgreedAmount())
                .status(c.getStatus())
                .submissionNote(c.getSubmissionNote())
                .submissionUrl(c.getSubmissionUrl())
                .submittedAt(c.getSubmittedAt())
                .createdAt(c.getCreatedAt())
                .jobTitle(c.getJobTitle())
                .deadline(c.getJobDeadline())
                .clientName(c.getClientName())
                .freelancerName(c.getFreelancerName())
                .deliveryDays(c.getDeliveryDays())
                .revisionNote(c.getRevisionNote())
                .revisionRequestedAt(c.getRevisionRequestedAt())
                .reviewedByClient(reviewRepository.existsByContractIdAndReviewerId(c.getId(), c.getClientId()))
                .reviewedByFreelancer(reviewRepository.existsByContractIdAndReviewerId(c.getId(), c.getFreelancerId()))
                .build();
    }
}
