import FloatingLines from "./FloatingLines";

export function LandingBackground({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 -z-10">
                <FloatingLines
                    enabledWaves={["top", "middle", "bottom"]}
                    lineCount={5}
                    lineDistance={5}
                    bendRadius={5}
                    bendStrength={-0.5}
                    interactive={true}
                    parallax={true}
                />

                {/* Readability overlay */}
                <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />
            </div>

            {children}
        </div>
    );
}
