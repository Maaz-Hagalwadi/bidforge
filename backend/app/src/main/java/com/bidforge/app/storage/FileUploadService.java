package com.bidforge.app.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

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
        try {
            String fileName = folder + UUID.randomUUID() + "_" + file.getOriginalFilename();

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(fileName)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );

            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, fileName);

        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("S3 upload error: {}", e.getMessage());
            throw new RuntimeException("S3 upload error: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds 10MB");
        }
    }
}