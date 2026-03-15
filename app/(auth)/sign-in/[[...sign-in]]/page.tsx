import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <span className="font-display text-2xl font-bold tracking-tight text-[#1c1917]">hackie</span>
        <p className="text-[#a8a29e] text-xs mt-1 uppercase tracking-widest">sign in to your account</p>
      </div>
      <SignIn
        appearance={{
          variables: {
            colorBackground: '#ffffff',
            colorText: '#1c1917',
            colorTextSecondary: '#6b6560',
            colorInputBackground: '#faf9f6',
            colorInputText: '#1c1917',
            colorPrimary: '#1c1917',
            borderRadius: '12px',
            fontFamily: 'var(--font-inter)',
          },
          elements: {
            card: 'bg-white border border-[#e2ddd6] shadow-sm rounded-2xl',
            headerTitle: 'text-[#1c1917] font-display',
            headerSubtitle: 'text-[#6b6560]',
            socialButtonsBlockButton: 'bg-[#faf9f6] border border-[#e2ddd6] text-[#1c1917] hover:bg-[#f5f3ef] rounded-xl transition-colors',
            dividerLine: 'bg-[#e2ddd6]',
            dividerText: 'text-[#a8a29e]',
            formFieldLabel: 'text-[#6b6560] text-xs uppercase tracking-widest',
            formFieldInput: 'bg-[#faf9f6] border border-[#e2ddd6] text-[#1c1917] focus:border-[#b8956a] rounded-xl transition-colors',
            formButtonPrimary: 'bg-[#1c1917] text-white hover:bg-[#3a3530] rounded-xl transition-colors font-medium',
            footerActionLink: 'text-[#b8956a] hover:text-[#a07850]',
            identityPreviewText: 'text-[#1c1917]',
            identityPreviewEditButtonIcon: 'text-[#6b6560]',
            alertText: 'text-[#c0392b]',
            formResendCodeLink: 'text-[#b8956a]',
          },
        }}
      />
    </div>
  );
}
