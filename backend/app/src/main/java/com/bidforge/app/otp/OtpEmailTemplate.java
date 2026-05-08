package com.bidforge.app.otp;


public class OtpEmailTemplate {

    private OtpEmailTemplate() {}

    public static String buildOtpEmail(String otp) {
        return """
                Your BidForge login OTP is: %s
                
                This OTP is valid for 5 minutes.
                
                If you did not request this, please ignore this email.
                """
                .formatted(otp);
    }
}
