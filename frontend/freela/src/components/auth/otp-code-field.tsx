"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type OtpCodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function OtpCodeField({
  value,
  onChange,
  disabled = false,
  "aria-invalid": ariaInvalid,
}: OtpCodeFieldProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      inputMode="numeric"
      pattern="[0-9]*"
      disabled={disabled}
      aria-invalid={ariaInvalid}
      containerClassName="justify-center"
      aria-label="Código de seis dígitos"
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
