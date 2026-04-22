package com.supersave.backend.common.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardingController {

    @GetMapping(value = {
            "/",
            "/dashboard",
            "/hospital/**",
            "/transfer",
            "/hospital-manager"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
