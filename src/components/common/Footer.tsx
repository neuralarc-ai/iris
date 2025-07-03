'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

const TERMS_CONTENT = (
  <div className="space-y-4 text-left">
    <p>Welcome to 86c. By accessing or using https://86c.neuralarc.ai (the "Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.</p>
    <h3 className="font-semibold mt-4">Use of Platform</h3>
    <p>The Platform is provided for informational and experimental purposes only. You agree to use it in compliance with all applicable laws and regulations.</p>
    <h3 className="font-semibold mt-4">User Content</h3>
    <p>You are responsible for any content you input or generate using the Platform. Do not submit unlawful, harmful, or infringing content.</p>
    <h3 className="font-semibold mt-4">Intellectual Property</h3>
    <p>All content, trademarks, and intellectual property on the Platform are owned by NeuralLink or its licensors. You may not copy, reproduce, or distribute any part of the Platform without permission.</p>
    <h3 className="font-semibold mt-4">Disclaimer of Warranties</h3>
    <p>The Platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or output.</p>
    <h3 className="font-semibold mt-4">Limitation of Liability</h3>
    <p>We are not liable for any damages arising from your use of the Platform, including direct, indirect, incidental, or consequential damages.</p>
    <h3 className="font-semibold mt-4">Changes to Terms</h3>
    <p>We may update these Terms of Use at any time. Continued use of the Platform constitutes acceptance of the revised terms.</p>
    <h3 className="font-semibold mt-4">Contact</h3>
    <p>For questions, contact us at: <a href="mailto:support@neuralarc.ai" className="underline">support@neuralarc.ai</a></p>
    <div className="text-xs text-muted-foreground mt-2">Last updated: May, 2025</div>
  </div>
);

const PRIVACY_CONTENT = (
  <div className="space-y-4 text-left">
    <p>NeuralLink ("Platform," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our Platform, including any AI-based tools or services we provide.</p>
    <h3 className="font-semibold mt-4">1. Information We Collect</h3>
    <p><b>a. Personal Information</b><br/>Information you voluntarily provide, such as: Name, Email address, Any additional contact details, Content or inputs provided to AI tools (if associated with a user identity)</p>
    <p><b>b. Usage Data</b><br/>Automatically collected information such as: IP address, Browser type and version, Operating system, Date and time of your visit, Pages viewed and time spent, Referring/exit pages, Clickstream data</p>
    <p><b>c. Cookies and Tracking Technologies</b><br/>We use cookies, pixels, and similar technologies for analytics and functionality. You can disable cookies through your browser settings.</p>
    <h3 className="font-semibold mt-4">2. How We Use Your Information</h3>
    <p>We use collected information for the following purposes:</p>
    <ul className="list-disc ml-6">
      <li>To operate, manage, and maintain the Platform.</li>
      <li>To improve the performance and accuracy of AI systems.</li>
      <li>To personalize your experience.</li>
      <li>To respond to queries or support requests.</li>
      <li>For data analysis and system monitoring.</li>
      <li>To comply with legal obligations.</li>
    </ul>
    <h3 className="font-semibold mt-4">3. Sharing and Disclosure</h3>
    <p>We do not sell your data. However, we may share your data in the following situations:</p>
    <ul className="list-disc ml-6">
      <li>With service providers who support our infrastructure, under strict data protection agreements.</li>
      <li>With law enforcement or government agencies when required by law.</li>
      <li>In case of business transitions, such as mergers or acquisitions.</li>
    </ul>
    <h3 className="font-semibold mt-4">4. Data Storage and Security</h3>
    <p>We employ industry-standard security practices including: SSL encryption, Access control protocols, Regular vulnerability scans. Despite our efforts, no digital transmission or storage system is completely secure. Use at your own discretion.</p>
    <h3 className="font-semibold mt-4">5. Your Rights</h3>
    <p>Depending on your jurisdiction, you may have the following rights:</p>
    <ul className="list-disc ml-6">
      <li>Access to your data</li>
      <li>Correction of inaccurate data</li>
      <li>Deletion or restriction of processing</li>
      <li>Data portability</li>
      <li>Withdrawal of consent</li>
      <li>Lodging a complaint with a regulatory authority</li>
    </ul>
    <p>For inquiries, contact us at: <a href="mailto:support@neuralarc.ai" className="underline">support@neuralarc.ai</a></p>
    <div className="text-xs text-muted-foreground mt-2">Last updated: May, 2025</div>
  </div>
);

const DISCLAIMER_CONTENT = (
  <div className="space-y-4 text-left">
    <p>Please read this Disclaimer carefully before using the Platform.</p>
    <p>The tools and content available at https://86c.neuralarc.ai are provided "as is" and are intended for informational and experimental purposes only. By using the Platform, you acknowledge and agree to the following:</p>
    <h3 className="font-semibold mt-4">No Professional Advice</h3>
    <p>The AI-generated outputs are not a substitute for professional advice in:</p>
    <ul className="list-disc ml-6">
      <li>Legal</li>
      <li>Medical</li>
      <li>Financial</li>
      <li>Psychological</li>
      <li>or any other regulated domain.</li>
    </ul>
    <p>Always consult a licensed professional.</p>
    <h3 className="font-semibold mt-4">Limitation of Liability</h3>
    <p>We shall not be held liable for:</p>
    <ul className="list-disc ml-6">
      <li>Any direct or indirect loss or damage arising from reliance on AI outputs.</li>
      <li>Errors, inaccuracies, or omissions in the AI-generated content.</li>
      <li>Unintended consequences or misuse of AI tools.</li>
    </ul>
    <h3 className="font-semibold mt-4">User Responsibility</h3>
    <p>You are solely responsible for:</p>
    <ul className="list-disc ml-6">
      <li>The content you input into the system.</li>
      <li>How you use and interpret the output.</li>
      <li>Ensuring your use complies with applicable laws and ethical norms.</li>
    </ul>
  </div>
);

const RESPONSIBLE_CONTENT = (
  <div className="space-y-4 text-left">
    <h3 className="font-semibold mt-4">Responsible AI & Disclaimer</h3>
    <p>We are committed to developing and deploying AI responsibly. AI technologies hosted on https://86c.neuralarc.ai are designed to augment human decision-making, not replace it.</p>
    <h3 className="font-semibold mt-4">Our Principles</h3>
    <ul className="list-disc ml-6">
      <li><b>Transparency</b><br/>Clear communication when users are interacting with AI. Explanation of how results are generated wherever feasible.</li>
      <li><b>Human Oversight</b><br/>AI suggestions or outputs should be reviewed by a qualified human. Critical or sensitive decisions (e.g., legal or health matters) must not be made solely based on AI output.</li>
      <li><b>Robustness and Safety</b><br/>We test AI systems to identify and minimize errors and unintended consequences. Feedback mechanisms are built to report inappropriate or harmful behavior.</li>
      <li><b>Privacy-Aware Design</b><br/>Minimal collection of personal data. Short-term retention of user inputs (only if necessary).</li>
      <li><b>Purpose Limitation</b><br/>AI tools are deployed only for clearly defined, ethical, and socially beneficial use cases.</li>
    </ul>
    <h3 className="font-semibold mt-4">Ethical AI Guidelines</h3>
    <p>We believe AI should benefit all users and be governed by principles that uphold fairness, accountability, and human dignity.</p>
    <h3 className="font-semibold mt-4">Key Values</h3>
    <ul className="list-disc ml-6">
      <li><b>Fairness & Non-Discrimination</b><br/>Our AI models are evaluated to reduce bias and promote inclusive use. Discriminatory or harmful content generation is actively monitored and filtered.</li>
      <li><b>Accountability</b><br/>We accept responsibility for the behavior and consequences of our AI systems. We encourage users to report concerns via <a href="mailto:support@neuralarc.ai" className="underline">support@neuralarc.ai</a></li>
      <li><b>Autonomy</b><br/>Users are empowered to understand and control their interaction with AI. AI should never manipulate, coerce, or deceive.</li>
      <li><b>Do No Harm</b><br/>We design AI tools with safeguards to prevent misuse, harm, or exploitation. Malicious use of AI tools is prohibited.</li>
      <li><b>Accessibility</b><br/>We strive to make the Platform accessible and usable by people of all backgrounds and abilities.</li>
    </ul>
    <div className="text-xs text-muted-foreground mt-2">Last updated: May, 2025</div>
  </div>
);

export default function Footer() {
  const [open, setOpen] = useState<null | 'terms' | 'privacy' | 'disclaimer' | 'responsible'>(null);

  return (
    <>
    <footer className="w-full py-6 px-4 border-t border-muted-foreground/10 bg-[#202020] text-center text-sm text-[#798682] flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
          <Dialog open={open === 'terms'} onOpenChange={v => setOpen(v ? 'terms' : null)}>
            <DialogTrigger asChild>
              <button className="hover:underline">Terms of use</button>
            </DialogTrigger>
            <DialogContent className='sm:max-h-[800px] overflow-scroll'>
              <DialogHeader>
                <DialogTitle>Terms of Use</DialogTitle>
              </DialogHeader>
              {TERMS_CONTENT}
            </DialogContent>
          </Dialog>
        <span className="mx-1">&bull;</span>
          <Dialog open={open === 'privacy'} onOpenChange={v => setOpen(v ? 'privacy' : null)}>
            <DialogTrigger asChild>
              <button className="hover:underline">Privacy Policy</button>
            </DialogTrigger>
            <DialogContent className='sm:max-h-[800px] overflow-scroll'>
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
              </DialogHeader>
              {PRIVACY_CONTENT}
            </DialogContent>
          </Dialog>
        <span className="mx-1">&bull;</span>
          <Dialog open={open === 'disclaimer'} onOpenChange={v => setOpen(v ? 'disclaimer' : null)}>
            <DialogTrigger asChild>
              <button className="hover:underline">Disclaimer</button>
            </DialogTrigger>
            <DialogContent className='sm:max-h-[800px] overflow-scroll'>
              <DialogHeader>
                <DialogTitle>Disclaimer</DialogTitle>
              </DialogHeader>
              {DISCLAIMER_CONTENT}
            </DialogContent>
          </Dialog>
        <span className="mx-1">&bull;</span>
          <Dialog open={open === 'responsible'} onOpenChange={v => setOpen(v ? 'responsible' : null)}>
            <DialogTrigger asChild>
              <button className="hover:underline">Responsible & Ethical AI</button>
            </DialogTrigger>
            <DialogContent className='sm:max-h-[800px] overflow-scroll'>
              <DialogHeader>
                <DialogTitle>Responsible & Ethical AI</DialogTitle>
              </DialogHeader>
              {RESPONSIBLE_CONTENT}
            </DialogContent>
          </Dialog>
        <span className="mx-1">&bull;</span>
        <span>
          All rights reserved. 86/c, a thing by 
          <a 
            href="https://neuralarc.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-extrabold hover:underline ml-1"
          >
            NeuralArc
          </a>
        </span>
      </div>
    </footer>
    </>
  );
} 