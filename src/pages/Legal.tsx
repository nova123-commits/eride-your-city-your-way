import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ERideLogo from "@/components/ERideLogo";

const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-base font-bold text-foreground mb-2">{num}. {title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 safe-top">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Legal Center</h1>
            <p className="text-xs text-muted-foreground">eRide Kenya Limited</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-12 safe-bottom">
        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="terms" className="text-xs">Terms</TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs">Privacy</TabsTrigger>
            <TabsTrigger value="driver" className="text-xs">Driver Agreement</TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-muted-foreground mb-4">Last updated: March 8, 2026</p>
              <Section num="1" title="Our Relationship">
                <p>These Terms of Service govern your access to and use of the eRide platform, including our mobile application and website. By using eRide, you agree to be bound by these terms.</p>
                <p>eRide Kenya Limited operates as a licensed Transportation Network Company (TNC) under the National Transport and Safety Authority (NTSA) regulations.</p>
              </Section>
              <Section num="2" title="Safety Protocols">
                <p>All riders and drivers must adhere to eRide's safety standards. Drivers undergo background checks and vehicle inspections before approval. In-app emergency features including SOS and trip sharing are available on every ride.</p>
              </Section>
              <Section num="3" title="Payments & Pricing">
                <p>Ride fares are calculated based on distance, time, and demand. eRide charges a 15% service fee on each trip. Payments are processed via M-Pesa and card. All fares are displayed before ride confirmation.</p>
              </Section>
              <Section num="4" title="Account Termination">
                <p>eRide reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or compromise the safety of the platform community.</p>
              </Section>
              <Section num="5" title="Dispute Resolution">
                <p>Any disputes shall be resolved through arbitration in Nairobi, Kenya, in accordance with the Arbitration Act of Kenya. Users may also contact our support team for resolution of ride-related issues.</p>
              </Section>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-muted-foreground mb-4">Last updated: March 8, 2026</p>
              <Section num="1" title="Data We Collect">
                <p>We collect personal information you provide (name, email, phone number), location data during rides, payment information, and device data. This data is essential for providing our ride-hailing services.</p>
              </Section>
              <Section num="2" title="How We Use Your Data">
                <p>Your data is used to match you with drivers, process payments, improve our services, ensure safety, and communicate important updates. We never sell your personal data to third parties.</p>
              </Section>
              <Section num="3" title="Data Protection">
                <p>eRide complies with the Kenya Data Protection Act, 2019. Your data is encrypted in transit and at rest. You have the right to access, correct, or delete your personal data at any time.</p>
              </Section>
              <Section num="4" title="Your Rights">
                <p>Under the Kenya Data Protection Act, you have the right to: request a copy of your data, opt out of marketing communications, request deletion of your account and associated data, and lodge complaints with the Data Commissioner.</p>
              </Section>
              <Section num="5" title="Cookies & Tracking">
                <p>We use essential cookies for app functionality and analytics cookies to improve our service. You can manage cookie preferences in your device settings.</p>
              </Section>
            </motion.div>
          </TabsContent>

          <TabsContent value="driver">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-muted-foreground mb-4">Last updated: March 8, 2026</p>
              <Section num="1" title="Independent Contractor Status">
                <p>Drivers using the eRide platform operate as independent contractors, not employees. You retain full control over your working hours and are free to use other platforms simultaneously.</p>
              </Section>
              <Section num="2" title="Commission Structure">
                <p>eRide charges a 15% commission on each completed trip — the lowest rate among major ride-hailing platforms in Kenya. Earnings are paid out instantly via M-Pesa after each trip.</p>
              </Section>
              <Section num="3" title="Vehicle Requirements">
                <p>All vehicles must pass eRide's inspection checklist, maintain valid insurance, and hold a current NTSA TNC operator license. Vehicles older than 10 years may not qualify.</p>
              </Section>
              <Section num="4" title="Driver Conduct">
                <p>Drivers must maintain a minimum 4.5-star rating, follow all traffic laws, and treat riders with respect. Violations may result in temporary suspension or permanent deactivation.</p>
              </Section>
              <Section num="5" title="Insurance & Liability">
                <p>eRide provides supplementary insurance coverage during active trips. Drivers are responsible for maintaining their own comprehensive vehicle insurance as required by Kenyan law.</p>
              </Section>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* NTSA Compliance */}
        <div className="mt-8 p-4 rounded-2xl border border-border bg-card">
          <h3 className="text-sm font-bold text-foreground mb-3">NTSA Compliance</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><span className="font-medium text-foreground">TNC License No:</span> NTSA/TNC/2026/001234</p>
            <p><span className="font-medium text-foreground">NTSA Support:</span>{" "}
              <a href="tel:+254709932000" className="text-primary hover:underline">+254 709 932 000</a>
            </p>
            <p><span className="font-medium text-foreground">NTSA Email:</span>{" "}
              <a href="mailto:dg@ntsa.go.ke" className="text-primary hover:underline">dg@ntsa.go.ke</a>
            </p>
            <p><span className="font-medium text-foreground">Website:</span>{" "}
              <a href="https://www.ntsa.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.ntsa.go.ke</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
