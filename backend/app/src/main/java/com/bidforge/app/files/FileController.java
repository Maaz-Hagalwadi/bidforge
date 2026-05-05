package com.bidforge.app.files;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FileController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip"
    );

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.server-url:http://localhost:8080}")
    private String serverUrl;

    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        try {
            String original = StringUtils.cleanPath(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
            );
            String ext = original.contains(".")
                    ? original.substring(original.lastIndexOf('.')).toLowerCase()
                    : "";
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new IllegalArgumentException("File type not allowed: " + ext);
            }
            String stored = UUID.randomUUID() + ext;

            Path dir = Paths.get(uploadDir, "chat").toAbsolutePath();
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);

            String contentType = file.getContentType() != null ? file.getContentType() : "";
            String fileType = contentType.startsWith("image/") ? "image" : "file";

            return Map.of(
                    "fileUrl", serverUrl + "/uploads/chat/" + stored,
                    "fileName", original,
                    "fileType", fileType
            );
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file: " + e.getMessage());
        }
    }
}
