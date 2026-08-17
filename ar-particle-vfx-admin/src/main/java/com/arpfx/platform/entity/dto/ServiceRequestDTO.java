package com.arpfx.platform.entity.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class ServiceRequestDTO implements Serializable {
    private String name;
    private String company;
    private String contact;
    private String type;
    private String description;
}
