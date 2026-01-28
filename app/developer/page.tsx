'use client'

import { motion } from 'framer-motion'
import { Github, Linkedin, Facebook, MapPin, GraduationCap, Cpu, Shield, ArrowLeft, Code } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function DeveloperPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100 },
    },
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative selection:bg-cyan-500/30">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15),transparent_50%)]" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        <Link href="/">
            <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ x: -5 }}
                className="flex items-center gap-2 text-cyan-400 mb-8 hover:text-cyan-300 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
            </motion.button>
        </Link>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-[350px_1fr] gap-8 md:gap-12 items-start"
        >
          {/* Profile Card */}
          <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative aspect-square mb-6 rounded-xl overflow-hidden border-2 border-cyan-500/30 group-hover:border-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Image
                src="https://github.com/sudostealth.png"
                alt="MD.SAZIB"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">MD.SAZIB</h1>
              <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                <span>Cybersecurity Enthusiast</span>
              </div>

              <div className="space-y-3 text-sm text-slate-400 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <MapPin className="w-5 h-5 text-cyan-500 shrink-0" />
                  <span>Charfassion, Bhola, Barishal</span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <GraduationCap className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>4th Year CSE, Green University of Bangladesh</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details Section */}
          <div className="space-y-8">
            <motion.section variants={itemVariants}>
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="w-8 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" />
                    About The Developer
                </h2>

                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Code className="w-24 h-24" />
                    </div>
                    <p className="text-lg text-slate-300 leading-relaxed mb-6 relative z-10">
                        I am not just a developer; I am a <span className="text-cyan-400 font-semibold">Technologist</span> at heart.
                        While this project showcases modern web technologies, my true passion lies in the depths of
                        <span className="text-cyan-400 font-semibold"> Cybersecurity</span> and <span className="text-blue-400 font-semibold">Blockchain</span>.
                    </p>
                    <p className="text-slate-300 leading-relaxed relative z-10">
                        Qubit is a manifestation of my curiosity—an exploration into how real-time systems, AI, and secure architecture converge.
                        Built during my undergraduate studies, it represents the bridge between theoretical knowledge and practical, interactive application.
                    </p>
                </div>
            </motion.section>

            <motion.section variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all group">
                    <Cpu className="w-8 h-8 text-cyan-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold text-white mb-2">Tech Stack Exploration</h3>
                    <p className="text-sm text-slate-400">Pushing the boundaries of Next.js 16+, Supabase Realtime, and Motion.</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all group">
                    <Shield className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold text-white mb-2">Security First</h3>
                    <p className="text-sm text-slate-400">Applying security principles to web architecture and data flow.</p>
                </div>
            </motion.section>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <a href="https://github.com/sudostealth" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <button className="w-full py-4 rounded-xl bg-[#24292e] hover:bg-[#2f363d] text-white font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] border border-white/10 shadow-lg hover:shadow-cyan-500/10">
                        <Github className="w-5 h-5" />
                        GitHub
                    </button>
                </a>
                <a href="https://www.linkedin.com/in/immdsazib" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <button className="w-full py-4 rounded-xl bg-[#0077b5] hover:bg-[#006399] text-white font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
                        <Linkedin className="w-5 h-5" />
                        LinkedIn
                    </button>
                </a>
                <a href="https://www.facebook.com/immdsazib" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <button className="w-full py-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
                        <Facebook className="w-5 h-5" />
                        Facebook
                    </button>
                </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
