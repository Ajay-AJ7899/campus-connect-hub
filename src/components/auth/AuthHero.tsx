import heroVideo from "/videos/hero-video.mp4";
import logo from "@/assets/brand-logo.png";

const AuthHero = () => {
  return (
    <section className="hidden lg:flex w-1/2 relative overflow-hidden">
      {/* Video background */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Theme-aware overlays */}
      <div className="absolute inset-0 bg-background/40 dark:bg-background/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-transparent to-accent/35 dark:from-primary/25 dark:to-accent/25" />
      <div className="absolute inset-0 pattern-dots opacity-20 dark:opacity-15" />

      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-16">
        <div className="animate-slide-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-md shadow-float">
              <img
                src={logo}
                alt="Campus ONE logo"
                className="h-5 w-5 object-contain drop-shadow-sm contrast-125"
                loading="lazy"
              />
              Campus ONE • Smart matching
            </p>

          <h2 className="mt-6 text-4xl xl:text-6xl font-extrabold leading-[1.02] tracking-tight text-foreground">
            Your campus rides,
            <br />
            <span className="gradient-text">actually effortless</span>
          </h2>

          <p className="mt-6 text-lg xl:text-xl text-foreground/80 max-w-lg">
            Find verified riders, split costs, and coordinate in minutes—built for students.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 max-w-lg">
            {[
              "Verified profiles",
              "Live ride updates",
              "Safer meetups",
              "Save on trips",
            ].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-border/60 bg-card/55 px-4 py-4 text-sm font-semibold text-foreground backdrop-blur-md shadow-float"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-12 flex gap-10">
            <div>
              <div className="text-3xl font-extrabold text-foreground">500+</div>
              <div className="text-sm font-medium text-foreground/70">Active Riders</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">15</div>
              <div className="text-sm font-medium text-foreground/70">Campuses</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">2K+</div>
              <div className="text-sm font-medium text-foreground/70">Trips Shared</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthHero;
