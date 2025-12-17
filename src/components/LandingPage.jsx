// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Trophy, Users, Zap, TrendingUp, Award, Gamepad } from "lucide-react";
import { useLandingData } from "../hooks/useLandingData";
import AnimatedCounter from "./AnimatedCounter";
import PlayerStatistics from "./PlayerStatistics";
import { useRef, useMemo, useState, useEffect } from "react";

/**
 * LandingPage Component
 * Apple-style parallax landing page with community stats
 */
export default function LandingPage({ onEnterApp }) {
  const { stats, players, heroes, loading } = useLandingData();

  // Ref for video element
  const videoRef = useRef(null);

  // State for flip cards
  const [flippedCards, setFlippedCards] = useState({});

  // State for player statistics modal
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerStats, setShowPlayerStats] = useState(false);

  // Set video start time to 8 seconds
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 8;
    }
  }, []);

  // Player-specific funny quotes with custom names
  const funnyQuotes = {
    "humbledog": { quote: "Predicts everything… except the gank.", name: "Tebo" },
    "@Nine.!": { quote: "God of Oracle but God from Temu", name: "Purevee" },
    "Elchapo": { quote: "It's not my fault", name: "Tegshee" },
    "xaky": { quote: "Feeding is just aggressive warding", name: "Tuguldur" },
    ".911": { quote: "Immortal brain, disconnected hands.", name: "Nimqa" },
    "Woody": { quote: "Tilting is my warm-up routine", name: "Khasaa" },
    "Orgil": { quote: "I'm not feeding, I'm scouting!", name: "Orgil" },
    "Khume": { quote: "Professional explainer, part-time player.", name: "Khuslen" },
    "Rozigoo": { quote: "Supporting the team by farming.", name: "Zorigoo" },
    "Brown OO": { quote: "Playing Dota vs enemy team and my PC.", name: "Magnai" }
  };

  // Hover handlers for card flipping
  const handleCardHover = (playerName, isHovering) => {
    setFlippedCards(prev => ({
      ...prev,
      [playerName]: isHovering
    }));
  };

  // Get rank name from rank_tier or string
  const getRankName = (rankTier) => {
    if (!rankTier) return "Unranked";
    // Handle manual string ranks (e.g., "archon")
    if (typeof rankTier === "string") {
      return rankTier.charAt(0).toUpperCase() + rankTier.slice(1);
    }
    // Handle OpenDota rank tiers (number)
    const ranks = [
      "Herald",
      "Guardian",
      "Crusader",
      "Archon",
      "Legend",
      "Ancient",
      "Divine",
      "Immortal",
    ];
    const tier = Math.floor(rankTier / 10);
    const star = rankTier % 10;
    if (tier === 8) return `Immortal ${star > 0 ? `#${star}` : ""}`;
    return `${ranks[tier - 1]} ${star}`;
  };

  // Background images for each section
  const backgroundImages = useMemo(
    () => [
      "/backgrounds/bgimage4.jpg",
      "/backgrounds/bgimage2.jpg",
      "/backgrounds/bgimage5.jpg",
      "/backgrounds/bgimage1.jpg",
      "/backgrounds/bgimage3.jpg",
      "/backgrounds/bgimage6.jpg",
      "/backgrounds/bgimage7.jpg",
      "/backgrounds/bgimage8.jpg",
    ],
    []
  );


  return (
    <div className="relative w-full bg-slate-950">
      {/* Hero Section with Video - Full Screen */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/battle.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/30 via-slate-900/40 to-slate-950/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-6xl w-full mx-auto px-4"
          >
            {/* Continuous Looping Title with Page Break Animation */}
            <div className="mb-8">
              <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight">
                {"PERMUM SUGA".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: [1, 1, 0.95, 1, 1],
                      y: [0, -10, -20, -10, 0],
                      scale: [1, 1.05, 1.1, 1.05, 1],
                    }}
                    transition={{
                      duration: 4,
                      delay: index * 0.1,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      ease: "easeInOut",
                    }}
                    className="inline-block"
                    style={{
                      background: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "#ec4899",
                      filter: "drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </h1>
            </div>

            {/* Subtitle */}
            <div className="mb-10">
              <p className="text-2xl sm:text-4xl lg:text-xl font-light text-white">
                {"Your Dota 2 Toxic Community".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: [1, 1, 0.95, 1, 1],
                      y: [0, -5, -8, -5, 0],
                      scale: [1, 1.02, 1.05, 1.02, 1],
                    }}
                    transition={{
                      duration: 3,
                      delay: 0.5 + index * 0.04,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut",
                    }}
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, #fff, #fff, #fff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </p>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute bottom-[-14] left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex flex-col items-center gap-2 text-slate-400"
            >
              <span className="text-sm font-medium">Scroll to Explore</span>
              <ChevronDown size={24} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative min-h-screen py-32 sm:py-48 px-4 flex items-center">
        {/* Scrolling Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImages[2]})`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-900/80 to-slate-950/90" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto">
            {/* Title with Writing Animation */}
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white inline-block"
              >
                {"Community at a Glance".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                    style={{
                      display: "inline-block",
                      whiteSpace: char === " " ? "pre" : "normal"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h2>
              {/* Animated underline */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "600px" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="h-1 bg-linear-to-r from-purple-600 via-pink-600 to-orange-600 mx-auto mt-6 rounded-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Total Games */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0 }}
                className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 hover:border-purple-600/50 transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-linear-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                    <Trophy size={32} className="text-white" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-black gradient-text mb-2">
                    <AnimatedCounter value={stats.totalGames} suffix="+" />
                  </div>
                  <p className="text-lg text-slate-300 font-medium">Total Games</p>
                </div>
              </motion.div>

              {/* Total Players */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 hover:border-cyan-600/50 transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-linear-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Users size={32} className="text-white" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-black gradient-text mb-2">
                    <AnimatedCounter value={stats.totalPlayers} />
                  </div>
                  <p className="text-lg text-slate-300 font-medium">Registered Players</p>
                </div>
              </motion.div>

              {/* Online Now */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 hover:border-green-600/50 transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-linear-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <Gamepad size={32} className="text-white" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-black gradient-text mb-2">
                    <AnimatedCounter value={stats.HeroesPlayed} />
                  </div>
                  <p className="text-lg text-slate-300 font-medium">Heroes Played</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section - Full Screen */}
      <section className="relative h-screen flex items-center justify-center px-0 py-0 overflow-hidden">
        {/* Scrolling Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImages[1]})`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Video Player - Full Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full h-full"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/dota2movie.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </section>

      {/* Live Stats Section - Background Image 3 */}
      

      {/* Disclaimer Message - Scroll-based Word Animation - Background Image 4 */}
      <DisclaimerSection backgroundImage={backgroundImages[3]} />

      {/* Leaderboard Section - Background Image 5 */}
      <section className="relative py-20 sm:py-32 px-4">
        {/* Scrolling Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImages[4]})`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/60 via-slate-900/50 to-slate-950/60" />

        {/* Content */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Title with Writing Animation */}
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white inline-block"
              >
                {"Top Players Leaderboard".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.03,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    style={{
                      display: "inline-block",
                      whiteSpace: char === " " ? "pre" : "normal"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h2>
              {/* Animated underline */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: "800px", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-1 bg-linear-to-r from-yellow-500 via-orange-500 to-red-500 mx-auto mt-6 rounded-full"
              />
            </div>

            {loading ? (
              <div className="text-center text-slate-400">Loading players...</div>
            ) : players.length === 0 ? (
              <div className="text-center text-slate-400 text-lg">
                Be the first to join our community!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player, index) => {
                  const isTopThree = index < 3;
                  const medalColors = {
                    0: "from-yellow-400 to-yellow-600",
                    1: "from-gray-300 to-gray-500",
                    2: "from-orange-500 to-orange-700",
                  };
                  const glowColors = {
                    0: "shadow-yellow-500/50",
                    1: "shadow-gray-400/50",
                    2: "shadow-orange-500/50",
                  };

                  const isFlipped = flippedCards[player.name];
                  const playerImageFilename = player.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
                  const playerImage = `/player_images/${playerImageFilename}.jpg`;

                  return (
                    <motion.div
                      key={player.name}
                      initial={{
                        opacity: 0,
                        y: 50,
                        scale: 0.9,
                        rotateX: 10,
                        filter: "blur(10px)"
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0,
                        filter: "blur(0px)"
                      }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{
                        duration: 0.8,
                        delay: index * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                        filter: { duration: 0.6 }
                      }}
                      onMouseEnter={() => handleCardHover(player.name, true)}
                      onMouseLeave={() => handleCardHover(player.name, false)}
                      onClick={() => {
                        setSelectedPlayer(player.name);
                        setShowPlayerStats(true);
                      }}
                      className="cursor-pointer"
                      style={{
                        perspective: "1500px"
                      }}
                    >
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative w-full h-[140px] rounded-2xl ${
                          isTopThree
                            ? "hover:shadow-2xl hover:shadow-yellow-500/20"
                            : "hover:shadow-xl hover:shadow-cyan-500/10"
                        }`}
                        style={{
                          transformStyle: "preserve-3d"
                        }}
                      >
                        {/* FRONT OF CARD */}
                        <div
                          className={`absolute inset-0 w-full h-full bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border ${
                            isTopThree
                              ? "border-yellow-500/30"
                              : "border-slate-700/50"
                          } transition-all overflow-hidden`}
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)"
                          }}
                        >
                      {/* Animated shimmer for top 3 */}
                      {isTopThree && (
                        <motion.div
                          className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "linear"
                          }}
                        />
                      )}

                      {/* Rank Badge with Animation */}
                      <div className="absolute -top-3 -left-3 flex items-center gap-2 z-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: index * 0.1 + 0.3
                          }}
                          whileHover={{
                            scale: 1.2,
                            rotate: 360,
                            transition: { duration: 0.6 }
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold text-white shadow-lg ${
                            isTopThree
                              ? `bg-linear-to-br ${medalColors[index]} border-yellow-500/60 ${glowColors[index]}`
                              : "bg-slate-900 border-slate-700"
                          }`}
                        >
                          #{index + 1}
                        </motion.div>
                        {isTopThree && (
                          <motion.div
                            initial={{ scale: 0, rotate: -90, opacity: 0 }}
                            whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                              delay: index * 0.1 + 0.5
                            }}
                          >
                            <motion.div
                              animate={{
                                y: [0, -5, 0],
                                rotate: [0, 10, 0, -10, 0]
                              }}
                              transition={{
                                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                              }}
                            >
                              <Award
                                size={28}
                                className={`bg-linear-to-br ${medalColors[index]} text-white drop-shadow-lg`}
                                style={{
                                  filter: `drop-shadow(0 0 10px ${index === 0 ? '#facc15' : index === 1 ? '#9ca3af' : '#f97316'})`
                                }}
                              />
                            </motion.div>
                          </motion.div>
                        )}
                      </div>

                      {/* Player Info */}
                      <motion.div
                        className="flex items-center gap-4 mt-6"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                      >
                        {player.avatar && (
                          <motion.img
                            src={player.avatar}
                            alt={player.name}
                            className={`w-16 h-16 rounded-full border-2 ${
                              isTopThree ? "border-yellow-500/60" : "border-slate-700"
                            }`}
                            whileHover={{
                              scale: 1.1,
                              rotate: 5,
                              transition: { type: "spring", stiffness: 400 }
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <motion.h3
                            className="text-base font-bold text-white truncate"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            {player.name}
                          </motion.h3>
                          <motion.div
                            className="text-xs text-yellow-400 font-medium mb-1"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.55 }}
                          >
                            {getRankName(player.rank)}
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-2 text-xs flex-wrap"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.6 }}
                          >
                            <span className="text-cyan-400 font-semibold">
                              {player.mmr} MMR
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-green-400 font-semibold">
                              {(Number(player?.winRate) || 0).toFixed(1)}% WR
                            </span>
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-2 text-xs mt-0.5"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.65 }}
                          >
                            <span className="text-slate-400">
                              {player.totalGames || 0} games
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-green-400">
                              {player.wins || 0}W
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className="text-red-400">
                              {player.losses || 0}L
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                      </div>

                        {/* BACK OF CARD */}
                        <div
                          className={`absolute inset-0 w-full h-full bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border ${
                            isTopThree
                              ? "border-yellow-500/30"
                              : "border-slate-700/50"
                          } overflow-hidden flex items-center justify-between gap-4`}
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)"
                          }}
                        >
                          {/* Player Photo - Left Side */}
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-full overflow-hidden bg-slate-900 border-3 border-slate-700/50">
                            <img
                              src={playerImage}
                              alt={player.name}
                              className="w-full h-full object-cover relative z-10"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement.querySelector('.fallback-gradient');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            {/* Fallback gradient */}
                            <div
                              className="fallback-gradient absolute inset-0 bg-linear-to-br from-purple-600 to-pink-600 hidden items-center justify-center z-0"
                            >
                              <Gamepad size={36} className="text-white opacity-50" />
                            </div>
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none z-20" />
                          </div>

                          {/* Funny Quote - Right Side */}
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="text-sm font-bold text-white mb-1 leading-tight">
                              "{funnyQuotes[player.name]?.quote || "Legend in the making! 🌟"}"
                            </p>
                            <p className="text-xs text-slate-400 italic mb-2">
                              - {funnyQuotes[player.name]?.name || player.name}
                            </p>
                            {/* Click hint */}
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="text-[10px] text-slate-500"
                            >
                              Click to flip back
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hero Statistics Section - Background Image 6 */}
      <section className="relative min-h-screen py-32 sm:py-48 px-4 flex items-center">
        {/* Scrolling Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImages[5]})`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-900/80 to-slate-950/90" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto">
            {/* Title with Writing Animation */}
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white inline-block"
              >
                {"Most Popular Heroes".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.03,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    style={{
                      display: "inline-block",
                      whiteSpace: char === " " ? "pre" : "normal"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h2>
              {/* Animated underline */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: "560px", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-1 bg-linear-to-r from-purple-500 via-pink-500 to-red-500 mx-auto mt-6 rounded-full"
              />
            </div>

            {heroes.length === 0 ? (
              <div className="text-center text-slate-400 text-lg">
                No hero data available yet
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                {heroes.map((hero, index) => (
                  <motion.div
                    key={hero.hero_name}
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      y: 30,
                      rotateX: -15,
                      filter: "blur(10px)"
                    }}
                    whileInView={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      rotateX: 0,
                      filter: "blur(0px)"
                    }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.7,
                      delay: index * 0.08,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    whileHover={{
                      scale: 1.08,
                      y: -12,
                      rotateY: 8,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    }}
                    className="bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 hover:border-purple-500/70 hover:shadow-2xl hover:shadow-purple-500/20 transition-all cursor-pointer relative overflow-hidden group"
                    style={{
                      perspective: "1000px",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {/* Animated shimmer on hover */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform"
                      style={{ transition: "transform 0.8s ease-in-out" }}
                    />

                    {/* Hero Avatar with fallback */}
                    <motion.div
                      className="w-full aspect-square rounded-lg mb-3 overflow-hidden relative bg-slate-800 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {hero.avatar ? (
                        <motion.img
                          src={hero.avatar}
                          alt={hero.displayName}
                          className="w-full h-full object-cover"
                          initial={{ scale: 1.2, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: index * 0.08 + 0.2 }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {/* Gradient fallback */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white"
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", delay: index * 0.08 + 0.2 }}
                        style={{
                          background: `linear-gradient(135deg, ${getHeroColor(
                            hero.hero_name
                          )})`,
                          display: hero.avatar ? 'none' : 'flex',
                        }}
                      >
                        {hero.displayName.charAt(0)}
                      </motion.div>

                      {/* Pick count badge */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: index * 0.08 + 0.4
                        }}
                        className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1"
                      >
                        <TrendingUp size={10} className="text-purple-400" />
                        <span className="text-xs text-white font-bold">{hero.times_picked}</span>
                      </motion.div>
                    </motion.div>

                    {/* Hero Name */}
                    <motion.h3
                      className="text-sm font-bold text-white text-center mb-3"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 + 0.3 }}
                    >
                      {hero.displayName}
                    </motion.h3>

                    {/* Win Rate Bar */}
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 + 0.4 }}
                    >
                      <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden mb-2 shadow-inner">
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          whileInView={{ width: `${hero.win_rate}%`, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            width: { duration: 1.2, delay: index * 0.08 + 0.5, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.3, delay: index * 0.08 + 0.5 }
                          }}
                          className="h-full bg-linear-to-r from-green-500 via-emerald-500 to-green-400 shadow-lg shadow-green-500/50 relative"
                        >
                          <motion.div
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: "linear"
                            }}
                          />
                        </motion.div>
                      </div>
                      <motion.div
                        className="text-xs text-green-400 font-bold text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 + 0.7 }}
                      >
                        {hero.win_rate.toFixed(1)}% WR
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Background Image 7 */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pb-20">
        {/* Scrolling Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImages[6]})`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/30 via-slate-900/40 to-slate-950/40" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8">
              Ready to Join noob?
            </h2>
            <motion.button
              onClick={onEnterApp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-linear-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/50 transition-all"
            >
              Enter Toxic Community
            </motion.button>
          </motion.div>
      </section>

      {/* Player Statistics Modal */}
      <PlayerStatistics
        playerName={selectedPlayer}
        isOpen={showPlayerStats}
        onClose={() => {
          setShowPlayerStats(false);
          setSelectedPlayer(null);
        }}
      />
    </div>
  );
}

/**
 * Disclaimer Section with Scroll-based Word Animation
 * Words start scattered and move into position as user scrolls
 * Background stays centered, only words animate
 */
function DisclaimerSection({ backgroundImage }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "end -0.5"], // Start when section enters viewport, end after it exits
  });

  const words = useMemo(
    () => "This site will not improve your MMR Sorry.".split(" "),
    []
  );

  // Generate random initial positions for each word (consistent across renders)
  // Using useState with lazy initializer to avoid impure function in render
  const [randomPositions] = useState(() =>
    words.map(() => ({
      x: (Math.random() - 0.8) * 700, // Random X between -600 and 600 (wider spread)
      y: (Math.random() - 0.2) * 500, // Random Y between -400 and 400 (taller spread)
    }))
  );

  // Generate random rotation amounts for wind scatter effect (consistent across renders)
  const [randomRotations] = useState(() =>
    words.map(() => (Math.random() - 0.5) * 90)
  );

  // Lower value = slower animation (spreads animation across more scroll distance)
  // 0.5 means animation completes at 50% scroll progress through section
  const animationSpeed = 0.6;
  const numWords = words.length;

  const word0 = useWordAnimation(scrollYProgress, randomPositions[0], 0, numWords, animationSpeed);
  const word1 = useWordAnimation(scrollYProgress, randomPositions[1], 1, numWords, animationSpeed);
  const word2 = useWordAnimation(scrollYProgress, randomPositions[2], 2, numWords, animationSpeed);
  const word3 = useWordAnimation(scrollYProgress, randomPositions[3], 3, numWords, animationSpeed);
  const word4 = useWordAnimation(scrollYProgress, randomPositions[4], 4, numWords, animationSpeed);
  const word5 = useWordAnimation(scrollYProgress, randomPositions[5], 5, numWords, animationSpeed);
  const word6 = useWordAnimation(scrollYProgress, randomPositions[6], 6, numWords, animationSpeed);
  const word7 = useWordAnimation(scrollYProgress, randomPositions[7], 7, numWords, animationSpeed);

  const wordAnimations = [word0, word1, word2, word3, word4, word5, word6, word7];

  // Sand wind effect - words fade and scatter away after forming sentence
  const windOpacity = useTransform(scrollYProgress, [0.6, 0.8, 1], [1, 1, 0]);
  const windScatter = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

  // Create wind scatter transforms for each word individually (hooks can't be in loops)
  const wind0X = useTransform(windScatter, [0, 1], [0, randomPositions[0].x * 2]);
  const wind0Y = useTransform(windScatter, [0, 1], [0, randomPositions[0].y * 2]);
  const wind0Rot = useTransform(windScatter, [0, 1], [0, randomRotations[0]]);

  const wind1X = useTransform(windScatter, [0, 1], [0, randomPositions[1].x * 2]);
  const wind1Y = useTransform(windScatter, [0, 1], [0, randomPositions[1].y * 2]);
  const wind1Rot = useTransform(windScatter, [0, 1], [0, randomRotations[1]]);

  const wind2X = useTransform(windScatter, [0, 1], [0, randomPositions[2].x * 2]);
  const wind2Y = useTransform(windScatter, [0, 1], [0, randomPositions[2].y * 2]);
  const wind2Rot = useTransform(windScatter, [0, 1], [0, randomRotations[2]]);

  const wind3X = useTransform(windScatter, [0, 1], [0, randomPositions[3].x * 2]);
  const wind3Y = useTransform(windScatter, [0, 1], [0, randomPositions[3].y * 2]);
  const wind3Rot = useTransform(windScatter, [0, 1], [0, randomRotations[3]]);

  const wind4X = useTransform(windScatter, [0, 1], [0, randomPositions[4].x * 2]);
  const wind4Y = useTransform(windScatter, [0, 1], [0, randomPositions[4].y * 2]);
  const wind4Rot = useTransform(windScatter, [0, 1], [0, randomRotations[4]]);

  const wind5X = useTransform(windScatter, [0, 1], [0, randomPositions[5].x * 2]);
  const wind5Y = useTransform(windScatter, [0, 1], [0, randomPositions[5].y * 2]);
  const wind5Rot = useTransform(windScatter, [0, 1], [0, randomRotations[5]]);

  const wind6X = useTransform(windScatter, [0, 1], [0, randomPositions[6].x * 2]);
  const wind6Y = useTransform(windScatter, [0, 1], [0, randomPositions[6].y * 2]);
  const wind6Rot = useTransform(windScatter, [0, 1], [0, randomRotations[6]]);

  const wind7X = useTransform(windScatter, [0, 1], [0, randomPositions[7].x * 2]);
  const wind7Y = useTransform(windScatter, [0, 1], [0, randomPositions[7].y * 2]);
  const wind7Rot = useTransform(windScatter, [0, 1], [0, randomRotations[7]]);

  // Create combined opacity transforms (word fade-in * wind fade-out)
  const combinedOpacity0 = useTransform([word0.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity1 = useTransform([word1.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity2 = useTransform([word2.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity3 = useTransform([word3.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity4 = useTransform([word4.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity5 = useTransform([word5.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity6 = useTransform([word6.opacity, windOpacity], ([base, wind]) => base * wind);
  const combinedOpacity7 = useTransform([word7.opacity, windOpacity], ([base, wind]) => base * wind);

  const windTransforms = [
    { x: wind0X, y: wind0Y, rotation: wind0Rot, opacity: combinedOpacity0 },
    { x: wind1X, y: wind1Y, rotation: wind1Rot, opacity: combinedOpacity1 },
    { x: wind2X, y: wind2Y, rotation: wind2Rot, opacity: combinedOpacity2 },
    { x: wind3X, y: wind3Y, rotation: wind3Rot, opacity: combinedOpacity3 },
    { x: wind4X, y: wind4Y, rotation: wind4Rot, opacity: combinedOpacity4 },
    { x: wind5X, y: wind5Y, rotation: wind5Rot, opacity: combinedOpacity5 },
    { x: wind6X, y: wind6Y, rotation: wind6Rot, opacity: combinedOpacity6 },
    { x: wind7X, y: wind7Y, rotation: wind7Rot, opacity: combinedOpacity7 }
  ];

  return (
    <section ref={sectionRef} className="relative px-4 min-h-[3000px]">
      {/* First background - fades out as you scroll */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          opacity: useTransform(scrollYProgress, [0, 0.5, 0.7], [1, 1, 0])
        }}
      />
      {/* Second background - fades in as you scroll */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(/backgrounds/bgimage8.jpg)`,
          opacity: useTransform(scrollYProgress, [0.5, 0.7, 1], [0, 1, 1])
        }}
      />
      {/* Dark overlay - gets darker as you scroll */}
      <motion.div
        className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-900/50 to-slate-950/70"
        style={{
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.5], [0.7, 0.9, 1])
        }}
      />

      {/* Content - Sticky container keeps text centered while animating */}
      <div className="sticky top-1/2 -translate-y-1/2 z-10 max-w-6xl mx-auto py-32">
        <div className="relative w-full text-center min-h-[200px] flex items-center justify-center">
          <div className="flex flex-wrap justify-center items-center gap-x-3">
            {words.map((word, index) => {
              // Get pre-created wind transforms for this word
              const wind = windTransforms[index];
              const wordAnim = wordAnimations[index];

              return (
                <motion.span
                  key={index}
                  style={{
                    // Base position animation (random to center)
                    x: wordAnim.x,
                    y: wordAnim.y,
                    // Wind scatter effect (additional translation)
                    translateX: wind.x,
                    translateY: wind.y,
                    // Combined opacity (word fade-in * wind fade-out)
                    opacity: wind.opacity,
                    // Wind rotation
                    rotate: wind.rotation,
                    display: "inline-block",
                    position: "relative",
                    fontFamily: "'Roboto', sans-serif"
                  }}
                  className="text-4xl sm:text-5xl lg:text-6xl text-white"
                >
                  {word}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-[1000px]" />
    </section>
  );
}

/**
 * Custom hook for creating word animations (must be called at component top level)
 */
function useWordAnimation(scrollYProgress, randomPos, index, totalWords, animationSpeed) {
  const wordStart = index / totalWords;
  const wordEnd = (index + 1) / totalWords;

  const x = useTransform(
    scrollYProgress,
    [wordStart * animationSpeed, wordEnd * animationSpeed],
    [randomPos.x, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [wordStart * animationSpeed, wordEnd * animationSpeed],
    [randomPos.y, 0]
  );

  const opacity = useTransform(
    scrollYProgress,
    [wordStart * animationSpeed, wordEnd * animationSpeed],
    [0.3, 1]
  );

  return { x, y, opacity };
}

/**
 * Generate a consistent color gradient for a hero based on their name
 */
function getHeroColor(heroName) {
  const colors = [
    "#a855f7, #ec4899", // purple-pink
    "#06b6d4, #3b82f6", // cyan-blue
    "#10b981, #059669", // green-emerald
    "#f59e0b, #ea580c", // orange
    "#ef4444, #dc2626", // red
    "#8b5cf6, #7c3aed", // violet
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < heroName.length; i++) {
    hash = heroName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
