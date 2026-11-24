package com.bidforge.files.storage;

import com.bidforge.files.upload.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "application/zip"
    );

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.server-url:http://localhost:8085}")
    private String serverUrl;

    @Value("${aws.s3.bucket:}")
    private String bucket;

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Autowired(required = false)
    private S3Client s3Client;

    private boolean isS3Enabled() {
        return s3Client != null && !bucket.isBlank();
    }

    public FileUploadResponse store(MultipartFile file, String subfolder) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "File type not allowed: " + contentType + ". Allowed types: images, PDF, Word, Excel, text, ZIP.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String uniqueFilename = UUID.randomUUID() + extension;

        if (isS3Enabled()) {
            String key = subfolder + "/" + uniqueFilename;
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));
            String fileUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
            log.info("Uploaded file to S3: {}", fileUrl);
            return new FileUploadResponse(fileUrl, originalFilename, contentType);
        } else {
            Path uploadPath = Paths.get(uploadDir, subfolder);
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = serverUrl + "/files/" + subfolder + "/" + uniqueFilename;
            log.info("Saved file to local disk: {}", filePath);
            return new FileUploadResponse(fileUrl, originalFilename, contentType);
        }
    }

    public Resource loadAsResource(String subfolder, String filename) throws IOException {
        Path filePath = Paths.get(uploadDir, subfolder).resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new FileNotFoundException("File not found: " + subfolder + "/" + filename);
        }
        return resource;
    }
}
