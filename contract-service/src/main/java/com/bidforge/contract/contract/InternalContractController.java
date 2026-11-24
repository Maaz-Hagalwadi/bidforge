package com.bidforge.contract.contract;

import com.bidforge.contract.contract.dto.ContractResponse;
import com.bidforge.contract.contract.dto.CreateContractRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

// Internal endpoint — called by job-service when a bid is accepted, not exposed to users
@RestController
@RequestMapping("/internal/contracts")
@RequiredArgsConstructor
public class InternalContractController {

    private final ContractService contractService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContractResponse createContract(@RequestBody CreateContractRequest request) {
        return contractService.createContract(request);
    }
}
