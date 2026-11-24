package com.bidforge.files.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Config {

    @Value("${aws.access-key:}")
    private String accessKey;

    @Value("${aws.secret-key:}")
    private String secretKey;

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${aws.s3.bucket:}")
    private String bucket;

    /**
     * Creates an S3Client bean only when aws.s3.bucket is non-empty.
     * FileStorageService autowires this as optional — if the bean is absent,
     * it falls back to local disk storage.
     */
    @Bean
    @ConditionalOnExpression("!'${aws.s3.bucket:}'.isEmpty()")
    public S3Client s3Client() {
        if (accessKey.isBlank() || secretKey.isBlank()) {
            // Fall back to default credential chain (IAM role, env vars, etc.)
            return S3Client.builder()
                    .region(Region.of(region))
                    .build();
        }
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
}
