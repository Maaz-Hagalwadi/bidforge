package com.bidforge.app.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ProfileCompletion {

    private int percentage;
    private boolean portfolioAdded;
    private boolean skillsAdded;
    private boolean bioAdded;
}