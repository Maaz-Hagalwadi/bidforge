package com.bidforge.app.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadService {

    @Nullable
    @Autowired(required = false)
    private S3Client s3Client;

    @Value("${aws.s3.bucket:}")
    private String bucket;

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.server-url:http://localhost:8080}")
    private String serverUrl;

    public String uploadProfileImage(MultipartFile file) {
        return upload(file, "profile-images/");
    }

    public String uploadJobAttachment(MultipartFile file) {
        return upload(file, "job-attachments/");
    }

    public String uploadChatFile(MultipartFile file) {
        return upload(file, "chat-files/");
    }

    private String upload(MultipartFile file, String folder) {
        validateFile(file);
        String fileName = folder + UUID.randomUUID() + "_" + file.getOriginalFilename();

        if (s3Client != null && !bucket.isBlank()) {
            return uploadToS3(file, fileName);
        }
        return uploadToLocalDisk(file, fileName);
    }

    private String uploadToS3(MultipartFile file, String fileName) {
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket).key(fileName)
                            .contentType(file.getContentType()).build(),
                    RequestBody.fromBytes(file.getBytes()));
            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, fileName);
        } catch (IOException e) {
            throw new RuntimeException("S3 upload failed: " + e.getMessage());
        }
    }

    private String uploadToLocalDisk(MultipartFile file, String fileName) {
        try {
            Path dir = Paths.get(uploadDir, fileName).getParent();
            Files.createDirectories(dir);
            Path dest = Paths.get(uploadDir, fileName);
            Files.write(dest, file.getBytes());
            return serverUrl + "/uploads/" + fileName;
        } catch (IOException e) {
            log.error("Local file upload failed: {}", e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new RuntimeException("File is empty");
        if (file.getSize() > 20 * 1024 * 1024) throw new RuntimeException("File size exceeds 20MB");
    }
}
