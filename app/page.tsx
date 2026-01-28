'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Gamepad2, Users, Zap, Trophy, Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-glow mb-6">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">Powered by Real-Time Technology</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
          >
            <span className="gradient-text">Qubit</span>
            <br />
            <span className="text-gray-800">Quiz. Play. Win.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
          >
            Create engaging real-time quizzes and play with friends, classmates, or colleagues.
            Experience the thrill of live competition!
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/join" className="group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary text-xl px-12 py-6 flex items-center gap-3"
              >
                <Gamepad2 className="w-6 h-6" />
                Join Game
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary text-xl px-12 py-6"
              >
                Create Quiz
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text"
          >
            Why Choose Qubit?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="card-hover text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="card-hover">
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 mt-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Teaser */}
      <section className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 md:p-12 hover:border-cyan-500/30 transition-colors group cursor-pointer"
            >
                <Link href="/developer">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/50 group-hover:border-cyan-400 transition-all group-hover:scale-110 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <Image
                                src="https://github.com/sudostealth.png"
                                alt="Developer"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                Meet the Creator
                            </h2>
                            <p className="text-slate-400 text-lg group-hover:text-slate-300 transition-colors">
                                Curious about the mind behind Qubit?
                            </p>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="px-6 py-2 rounded-full bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                        >
                           <span>Discover More</span>
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.div>
                    </div>
                </Link>
            </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            <span className="gradient-text">Qubit</span>
          </h3>
          <p className="text-gray-400 mb-6">
            Real-time quiz platform built with Next.js, Supabase, and Framer Motion
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>© 2026 Qubit</span>
            <span>•</span>
            <span>Built with ❤️</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Real-time updates with Supabase Realtime. No lag, no delays.',
  },
  {
    icon: Users,
    title: 'Multiplayer',
    description: 'Play with up to 100 participants simultaneously.',
  },
  {
    icon: Trophy,
    title: 'Competitive',
    description: 'Live leaderboards and scoring based on speed and accuracy.',
  },
  {
    icon: Sparkles,
    title: 'Beautiful UI',
    description: 'Stunning animations and responsive design for all devices.',
  },
]

const steps = [
  {
    title: 'Create a Quiz',
    description: 'Sign up as an organizer and create your quiz with custom questions, time limits, and settings.',
  },
  {
    title: 'Share the PIN',
    description: 'Start a game session and share the 6-digit PIN with your players.',
  },
  {
    title: 'Play & Compete',
    description: 'Players join, answer questions in real-time, and compete for the top spot on the leaderboard!',
  },
]
