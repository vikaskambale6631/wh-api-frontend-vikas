export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gray-900">
            {/* Background Image */}
            <div
                className="fixed inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/login-bg.png)',
                }}
            >
                {/* Overlay to ensure card pops */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full flex flex-col items-center">
                {children}


            </div>
        </div>
    )
}
