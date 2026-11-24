package com.bidforge.files.upload;

import com.bidforge.files.storage.FileStorageService;
import com.bidforge.files.upload.dto.FileUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService storageService;

    // Upload endpoint — any authenticated user
    @PostMapping("/files/upload")
    public ResponseEntity<FileUploadResponse> upload(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(storageService.store(file, "general"));
    }

    // Job attachment — CLIENT only
    @PostMapping("/files/job-attachment")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<FileUploadResponse> uploadJobAttachment(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(storageService.store(file, "jobs"));
    }

    // Serve file from local disk (only used when S3 is not configured)
    @GetMapping("/files/{subfolder}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String subfolder,
            @PathVariable String filename) throws IOException {
        Resource resource = storageService.loadAsResource(subfolder, filename);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
