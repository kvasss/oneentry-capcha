import type { Dispatch, JSX } from 'react';
import { useEffect, useRef } from 'react';

// Type declaration for Google reCAPTCHA (classic v3 + Enterprise)
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (key: string, options: { action: string }) => Promise<string>;
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (key: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

/**
 * FormReCaptcha component for Google reCAPTCHA v3 Enterprise integration.
 * @param   {object}            props              - FormReCaptcha props.
 * @param   {string}            props.siteKey      - Google reCAPTCHA site key.
 * @param   {string}            props.action       - Action name for this verification.
 * @param   {Dispatch<string>}  props.setToken     - Function to set the token.
 * @param   {Dispatch<boolean>} props.setIsCaptcha - Function to set captcha state.
 * @param   {Dispatch<boolean>} props.setIsValid   - Function to set validation state.
 * @returns {JSX.Element}                          FormReCaptcha component.
 */
const FormReCaptcha = ({
  siteKey,
  action = 'login',
  setToken,
  setIsCaptcha,
  setIsValid,
}: {
  siteKey: string;
  action?: string;
  setToken: Dispatch<string>;
  setIsCaptcha: Dispatch<boolean>;
  setIsValid: Dispatch<boolean>;
}): JSX.Element => {
  const scriptLoadedRef = useRef(false);
  const executedRef = useRef(false);

  /**
   * Executes reCAPTCHA Enterprise verification and gets token
   */
  const executeRecaptcha = async () => {
    if (executedRef.current) return;

    try {
      if (typeof window !== 'undefined' && window.grecaptcha?.enterprise) {
        window.grecaptcha.enterprise.ready(async () => {
          try {
            const token = await window.grecaptcha?.enterprise?.execute(siteKey, {
              action,
            });

            if (token) {
              executedRef.current = true;
              setToken(token);
              setIsValid(true);
            }
          } catch (error) {
            console.error('reCAPTCHA execution error:', error);
            setIsValid(false);
          }
        });
      }
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      setIsValid(false);
    }
  };

  /**
   * Loads reCAPTCHA script dynamically
   */
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const loadRecaptchaScript = () => {
      // Remove any classic reCAPTCHA script that may have leaked into the page (it conflicts with Enterprise)
      document
        .querySelectorAll('script[src*="recaptcha/api.js"]')
        .forEach((s) => s.remove());

      // Check if Enterprise script already exists
      const existingScript = document.querySelector(
        `script[src*="recaptcha/enterprise.js"]`
      );

      if (existingScript) {
        scriptLoadedRef.current = true;
        executeRecaptcha();
        return;
      }

      // Create and load script (reCAPTCHA Enterprise)
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        executeRecaptcha();
      };

      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
        setIsValid(false);
      };

      document.head.appendChild(script);
    };

    setIsCaptcha(true);
    loadRecaptchaScript();

    return () => {
      // Cleanup: remove script on unmount
      const script = document.querySelector(
        `script[src*="recaptcha/enterprise.js?render=${siteKey}"]`
      );
      if (script) {
        script.remove();
      }
    };
  }, [siteKey, setIsCaptcha, setIsValid]);

  /**
   * reCAPTCHA v3 is invisible, so no UI is rendered.
   * Token verification is performed server-side by the OneEntry form-data endpoint.
   */
  return <></>;
}

export default FormReCaptcha
