'use client'

import { useEffect, useState } from 'react'
import { X, QrCode as QrCodeIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'

interface QRCodeModalProps {
  pin: string
  isOpen: boolean
  onClose: () => void
}

export default function QRCodeModal({ pin, isOpen, onClose }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  useEffect(() => {
    if (isOpen && pin) {
      const generateQR = async () => {
        const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?pin=${pin}`
        try {
          const qrDataUrl = await QRCode.toDataURL(joinUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: '#4F46E5', // primary-600
              light: '#FFFFFF',
            },
          })
          setQrCodeUrl(qrDataUrl)
        } catch (err) {
          console.error('Error generating QR code:', err)
        }
      }
      generateQR()
    }
  }, [isOpen, pin])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Content */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCodeIcon className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Scan to Join
                </h2>
                <p className="text-gray-600 mb-6">
                  Players can scan this QR code to join the game instantly
                </p>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block mb-6">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code to join game"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* PIN Display */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 border border-primary-200">
                  <p className="text-sm text-gray-600 mb-1">Game PIN</p>
                  <p className="text-4xl font-black text-primary-600">{pin}</p>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Or visit <span className="font-mono font-semibold">{typeof window !== 'undefined' ? window.location.origin : ''}/join</span>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
