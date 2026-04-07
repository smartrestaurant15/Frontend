import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }
      
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const isValidLength = value.length >= 8;
      
      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;
      
      return !passwordValid ? { passwordStrength: true } : null;
    };
  }
  
  static matchPassword(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get(passwordField);
      const confirmPassword = control;
      
      if (!password || !confirmPassword) {
        return null;
      }
      
      return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    };
  }
  
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isWhitespace = (control.value || '').trim().length === 0;
      return isWhitespace ? { whitespace: true } : null;
    };
  }

  /** Solo letras (incluyendo acentos y ñ) y espacios. Rechaza números y caracteres especiales. */
  static onlyLetters(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const valid = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(value);
      return valid ? null : { onlyLetters: true };
    };
  }
}
