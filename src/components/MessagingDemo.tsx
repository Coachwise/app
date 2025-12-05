import { Send, Image as ImageIcon } from 'lucide-react';

export function MessagingDemo() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-[#0E0E55] mb-6">Messaging Interface Demo</h1>
      
      {/* DM Input Demo */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-[#0E0E55] mb-4">Direct Message Input (DMs)</h2>
        <div className="border-2 border-yellow-500 rounded-lg p-2">
          <div className="flex items-end gap-2">
            {/* Media Button */}
            <button
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-6 h-6" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-full focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                style={{ maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              className="p-3 bg-yellow-500 text-[#0E0E55] rounded-full hover:bg-yellow-400 transition-colors flex-shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          ✅ This input appears at the BOTTOM of the message thread
        </p>
        <p className="text-sm text-gray-600">
          📱 It's fixed to the bottom, so scroll down to see it
        </p>
      </div>

      {/* Channel Input Demo (Coach) */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-[#0E0E55] mb-4">Channel Input (For Coach/Owner)</h2>
        <div className="border-2 border-yellow-500 rounded-lg p-2">
          <div className="flex items-end gap-2">
            {/* Media Button */}
            <button
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-6 h-6" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                placeholder="Broadcast message to channel..."
                rows={1}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-full focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                style={{ maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              className="p-3 bg-yellow-500 text-[#0E0E55] rounded-full hover:bg-yellow-400 transition-colors flex-shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          ✅ Only visible when you&apos;re the channel owner (coach)
        </p>
        <p className="text-sm text-gray-600">
          📱 Fixed to the bottom, scroll down to see it
        </p>
      </div>

      {/* Read-Only Demo */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold text-[#0E0E55] mb-4">Channel (For Members - Read Only)</h2>
        <div className="bg-[#0E0E55] p-4 rounded-lg">
          <p className="text-white text-center text-sm">
            📢 Only Sarah Martinez can post in this channel
          </p>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          ℹ️ Members see this message instead of input
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
        <h3 className="font-bold text-[#0E0E55] mb-3">How to Test:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li><strong>For DMs:</strong> Go to Messages → Direct Messages → Click any conversation → <strong>SCROLL TO BOTTOM</strong></li>
          <li><strong>For Channels (as coach):</strong> Set role to Coach → Messages → Channels → Click any channel → <strong>SCROLL TO BOTTOM</strong></li>
          <li><strong>For Channels (as member):</strong> Set role to Athlete → Messages → Channels → See read-only message</li>
        </ol>
        <p className="mt-4 text-sm font-semibold text-red-600">
          ⚠️ KEY: The input is FIXED at the bottom of the screen. If you have many messages, you need to SCROLL DOWN to see it!
        </p>
      </div>
    </div>
  );
}
