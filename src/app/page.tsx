"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone, BellRing, ShieldCheck, Clock, MapPin, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";

export default function LandingPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow pt-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-[0.03]" />
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl filter" />
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl filter" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <h1 className="text-5xl md:text-7xl font-extrabold text-secondary tracking-tight mb-6 leading-tight">
                  No more <br/>
                  <span className="text-primary relative inline-block">
                    blocked cars.
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                    </svg>
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                  Scan. Ping. Move. ParkPing lets you anonymously contact any blocked car owner in seconds.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/order">
                    <Button size="lg" className="w-full sm:w-auto h-14 text-lg">
                      Get Your QR Sticker <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-lg">
                      See How It Works
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-10 flex items-center gap-4 text-sm font-medium text-gray-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User avatar" />
                      </div>
                    ))}
                  </div>
                  <span>Join 10,000+ drivers in India</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }} 
                animate={{ opacity: 1, scale: 1, rotate: 0 }} 
                transition={{ duration: 0.8, type: "spring" }}
                className="relative mx-auto w-full max-w-sm"
              >
                {/* Simulated Phone Mockup */}
                <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-primary/20 border-gray-800 border-[8px] relative h-[600px] overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 z-20 rounded-b-3xl w-40 mx-auto" />
                  <div className="bg-[#f2f4f7] w-full h-full rounded-3xl overflow-hidden flex flex-col pt-12 relative animate-pulse-slow">
                     {/* Mock App UI */}
                     <div className="px-6 pb-6">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mb-6 flex items-center justify-center mx-auto text-primary">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-gray-900 mb-1">MH 01 AB 1234</h3>
                        <p className="text-center text-gray-500 mb-8 font-medium">Hyundai Creta • Black</p>
                        
                        <div className="space-y-4">
                          <div className="bg-primary text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg shadow-primary/30">
                            <Phone className="fill-white" /> <span className="font-semibold text-lg">Call Owner</span>
                          </div>
                          <div className="bg-secondary text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg">
                            <BellRing /> <span className="font-semibold text-lg">Send Alert</span>
                          </div>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-6 mt-auto font-medium">Your number is hidden safely</p>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">We&apos;ve all been there.</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Parking in India is tough. Getting your car blocked is worse.</p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                { icon: Clock, title: "Blocked & Late", desc: "Your car is blocked by someone and you're already running late for that important meeting." },
                { icon: MapPin, title: "No Clue Who", desc: "You have absolutely no idea whose car it is, or which building they went into." },
                { icon: ShieldCheck, title: "Creating a Scene", desc: "No way to contact them without honking loudly or creating a public scene." }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeIn}>
                  <Card className="h-full border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-8 text-center px-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <item.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-secondary mb-3">{item.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">Three steps to freedom</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">A seamless experience for both the scanner and the owner.</p>
            </div>

            <div className="relative">

              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {[
                  { step: "01", title: "Scan the QR sticker", desc: "Found a blocked car? Simply scan the ParkPing sticker on their windshield using any camera." },
                  { step: "02", title: "Call or Alert", desc: "Choose whether to safely call the owner or send them an instant push notification alert." },
                  { step: "03", title: "Owner moves car", desc: "The owner is notified instantly and can share their ETA or move the car right away." }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, duration: 0.5 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-white border-4 border-primary rounded-full flex items-center justify-center text-3xl font-extrabold text-primary shadow-xl mb-6 relative">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-bold text-secondary mb-3">{item.title}</h3>
                    <p className="text-gray-500 text-lg">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 bg-secondary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Built for India. Built for everyone.</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Packed with precise features keeping your security and convenience in mind.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Anonymous Calls", desc: "Your number stays private always. Calls are routed through Twilio secure proxy." },
                { title: "Instant Alerts", desc: "Sends a high-priority push notification overriding silent mode in emergencies." },
                { title: `"I'm Coming" Button`, desc: "Owner can tap one button to send their ETA directly to the person waiting." },
                { title: "Scan History", desc: "Access full logs of exactly who scanned your QR code and when, for security." },
                { title: "OTP Verified", desc: "To prevent spam, anyone scanning must verify their number with a quick OTP first." },
                { title: "VAHAN Verified", desc: "Car details are double-checked with the government database during registration." }
              ].map((f, i) => (
                <div key={i} className="bg-gray-800/50 border border-gray-700 p-8 rounded-2xl hover:bg-gray-800 transition-colors">
                  <CheckCircle className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">Simple, affordable pricing</h2>
              <p className="text-lg text-gray-500 font-medium">First quarter subscription free with every QR sticker order.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Starter Card */}
              <Card className="border-2 border-gray-100 relative shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <CardContent className="p-8 flex flex-col h-full">
                  <h3 className="text-2xl font-bold text-secondary mb-2">QR Sticker Starter</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">₹149</span>
                    <span className="text-gray-500 font-medium">+₹49 delivery</span>
                  </div>
                  <p className="text-gray-500 mb-8 font-medium">One-time payment for your physical stickers.</p>
                  
                  <ul className="space-y-4 mb-8 flex-grow">
                    {[
                      "2 QR stickers included (front + back)",
                      "High quality thick laminated paper",
                      "Sun and rain resistant material",
                      "Pre-registered to your vehicle"
                    ].map((feature, i) => (
                      <li key={i} className="flex flex-start gap-3 text-gray-700 font-medium">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/order" className="mt-auto">
                    <Button variant="outline" className="w-full h-12 text-lg border-2">Order Now</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Sub Card */}
              <Card className="border-2 border-primary relative shadow-xl transform md:-translate-y-4 flex flex-col overflow-visible">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  Recommended
                </div>
                <CardContent className="p-8 flex flex-col h-full bg-primary/[0.02]">
                  <h3 className="text-2xl font-bold text-secondary mb-2">Pro Subscription</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">₹99</span>
                    <span className="text-gray-500 font-medium">/ quarter</span>
                  </div>
                  <p className="text-primary font-bold mb-8">First 3 months absolutely FREE!</p>
                  
                  <ul className="space-y-4 mb-8 flex-grow">
                    {[
                      "All app features unlocked",
                      "Full scan history logs",
                      "Unlimited anonymous calls",
                      "Priority VIP support"
                    ].map((feature, i) => (
                      <li key={i} className="flex flex-start gap-3 text-gray-700 font-medium">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth" className="mt-auto">
                    <Button variant="primary" className="w-full h-12 text-lg">Subscribe Now</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">What early users are saying</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Rahul Sharma", city: "Mumbai", text: "ParkPing literally saved me from missing my flight! Pinned my car location, scanned the guy who blocked me, and he moved it in 2 mins." },
                { name: "Priya Patel", city: "Bangalore", text: "I love that my phone number is hidden. As a woman, giving out random numbers to strangers in parking lots was always stressful." },
                { name: "Amit Gupta", city: "Delhi", text: "The sticker quality is fantastic. Survived the Delhi heat and heavy rains without peeling. Super straightforward to register." }
              ].map((t, i) => (
                <Card key={i} className="bg-white border-0 shadow-md">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4 text-[#FFB800]">
                      <Star className="fill-current w-5 h-5"/><Star className="fill-current w-5 h-5"/><Star className="fill-current w-5 h-5"/><Star className="fill-current w-5 h-5"/><Star className="fill-current w-5 h-5"/>
                    </div>
                    <p className="text-gray-600 mb-6 font-medium italic">&quot;{t.text}&quot;</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://i.pravatar.cc/150?img=${i * 10 + 12}`} alt={t.name} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{t.name}</h4>
                        <p className="text-sm text-gray-500">{t.city}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">Frequently Asked Questions</h2>
            </div>
            
            <Accordion items={[
              { question: "Will my phone number be visible to strangers?", answer: "Absolutely not. Your phone number is strictly kept private. When a scanner tries to call you, the call is routed through our Twilio secure proxy, meaning neither party sees the other's real phone number." },
              { question: "What if someone misuses the scan?", answer: "We require every person who scans a QR code to verify their mobile number with a one-time OTP before they can contact you. This drastically reduces spam, and you keep a log of every verified number that scanned your car." },
              { question: "How long does delivery take?", answer: "Once you place an order, your pre-registered, custom-printed QR stickers are dispatched within 48 hours. Depending on your city, standard delivery takes about 5 to 7 days." },
              { question: "Can I register multiple cars?", answer: "Yes! Currently, a single account can register up to 5 cars. You will need to order separate QR stickers for each vehicle since they are mapped individually to car numbers." },
              { question: "What happens if the owner doesn't respond?", answer: "If the owner does not acknowledge an alert or call within 10 minutes, the scanner receives a 'No Response' status. While we can't physically move the car, our logs hold the owner accountable for non-responsiveness." },
            ]} />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
