package com.bidforge.app.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class GenerateDescriptionResponse {
    private String description;
    private List<String> skills;
}
