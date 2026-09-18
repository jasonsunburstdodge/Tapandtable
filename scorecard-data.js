/*
 * Tap and Table Scorecard — category copy + scoring engine.
 *
 * IMPORTANT: runDemoScore() below is a transparent PLACEHOLDER. It derives
 * repeatable-but-not-real scores from the submitted name/concept/location so
 * the tool is demonstrable end to end. It is NOT connected to census,
 * competitive, review, or search data. See README.md "Putting the real
 * intelligence in place" before presenting results to real prospects as
 * anything other than a preview.
 */
(() => {
  "use strict";

  const STATUS_BANDS = [
    { min: 8.0, max: 10.01, key: "strong", label: "Strong" },
    { min: 6.5, max: 8.0, key: "solid", label: "Solid" },
    { min: 5.1, max: 6.5, key: "attention", label: "Needs Attention" },
    { min: -Infinity, max: 5.1, key: "concern", label: "Priority Concern" }
  ];

  function statusForScore(score) {
    return STATUS_BANDS.find((b) => score >= b.min && score < b.max) || STATUS_BANDS[STATUS_BANDS.length - 1];
  }

  // Each category: what it measures, plus a meaning + implication for each
  // of the four status bands (strong / solid / attention / concern).
  const CATEGORIES = [
    {
      key: "locationViability",
      label: "Location Viability",
      what: "How much the physical site itself — visibility, access, parking, traffic flow, and neighboring businesses — helps or hurts walk-in and drive-by business.",
      bands: {
        strong: {
          meaning: "The site is doing real work for you: it's easy to see, easy to reach, and sits in a natural path of traffic.",
          implication: "Marketing dollars go further because the location itself is already doing part of the selling."
        },
        solid: {
          meaning: "The fundamentals are in place, with a few friction points — signage, sightlines, or approach — worth sharpening.",
          implication: "You're not fighting the site, but a modest investment in visibility could convert more passersby into guests."
        },
        attention: {
          meaning: "Something about access, visibility, or traffic flow is quietly working against the concept.",
          implication: "You may be paying rent for exposure the site isn't actually delivering, which means marketing has to work harder to compensate."
        },
        concern: {
          meaning: "The physical site is creating a real, structural barrier to walk-in and drive-by traffic.",
          implication: "No marketing budget fully offsets a site guests struggle to see, reach, or park at — this is worth resolving before scaling spend."
        }
      }
    },
    {
      key: "marketDemand",
      label: "Market Demand",
      what: "Whether there are enough of the right potential guests within a realistic trade area to sustain the concept at the volume it needs.",
      bands: {
        strong: {
          meaning: "The trade area holds a deep, active base of the guests this concept is built to serve.",
          implication: "Demand is not the constraint here — execution and capacity are."
        },
        solid: {
          meaning: "There's a workable base of demand today, with room to grow the trade area or visit frequency.",
          implication: "Steady volume is achievable, but real growth likely means earning trips from farther out or driving repeat visits."
        },
        attention: {
          meaning: "The trade area's demand is thinner than this concept needs once it's running at full capacity.",
          implication: "You may be leaning on a smaller pool of repeat guests than is sustainable, which raises the stakes on retention and reach."
        },
        concern: {
          meaning: "There isn't yet a large enough base of the right guests nearby to reliably fill the concept.",
          implication: "Revenue will likely plateau below plan unless demand is actively imported from outside the immediate area."
        }
      }
    },
    {
      key: "competitiveOpportunity",
      label: "Competitive Opportunity",
      what: "How crowded the category already is nearby, and whether there's a real opening left for this concept to claim.",
      bands: {
        strong: {
          meaning: "There's a genuine, largely unclaimed opening in this category in this market.",
          implication: "You have room to define the category on your own terms before competitors catch on."
        },
        solid: {
          meaning: "The category has real competitors, but a defensible opening still exists.",
          implication: "Positioning and execution — not the market itself — will decide whether you claim that opening."
        },
        attention: {
          meaning: "The competitive set is crowding the space this concept wants to occupy.",
          implication: "Without sharper differentiation, guests may default to the competitor they already know."
        },
        concern: {
          meaning: "Several near-identical concepts already own this guest's attention in this market.",
          implication: "Entering without a distinct reason to switch risks a costly fight for guests who already have a favorite."
        }
      }
    },
    {
      key: "demographicFit",
      label: "Demographic Fit",
      what: "Whether the age, income, household composition, and lifestyle profile of the trade area matches who the concept is built to serve.",
      bands: {
        strong: {
          meaning: "The people who live and work nearby closely match the concept's intended guest.",
          implication: "Messaging can speak directly to a real, present audience instead of trying to attract one from elsewhere."
        },
        solid: {
          meaning: "The area is a reasonable match for the intended guest, with some segments better represented than others.",
          implication: "Targeting the right sub-segments in marketing will outperform a one-size-fits-all message."
        },
        attention: {
          meaning: "The area's demographic profile only partly overlaps with who this concept is designed for.",
          implication: "Some marketing spend will reach people who were never likely to become regulars, unless targeting is tightened."
        },
        concern: {
          meaning: "The area's demographic makeup is materially mismatched with the concept's intended guest.",
          implication: "Either the concept, the location, or the target guest needs to change — pushing forward as-is invites an uphill fight for every guest."
        }
      }
    },
    {
      key: "psychographicFit",
      label: "Psychographic Fit",
      what: "Whether the attitudes, values, and lifestyle motivations of nearby guests — not just their statistics — align with the concept's experience and positioning.",
      bands: {
        strong: {
          meaning: "The experience this concept is built around matches how people nearby actually like to spend their time and money.",
          implication: "Word-of-mouth and repeat visits should come more naturally, because the concept fits the local mindset, not just the local wallet."
        },
        solid: {
          meaning: "The concept's experience appeals to a meaningful share of the local mindset, with some segments a closer fit than others.",
          implication: "Leaning into the parts of the concept that resonate most locally will build loyalty faster than a generic approach."
        },
        attention: {
          meaning: "The concept's tone or experience doesn't fully match how this particular market likes to socialize and spend.",
          implication: "Even guests who fit demographically may not feel it's 'for them' unless the experience is calibrated to local expectations."
        },
        concern: {
          meaning: "There's a real gap between the experience this concept offers and what this market's guests actually want.",
          implication: "Guests may try it once out of curiosity but have little pull to return, which erodes the repeat visits most operators depend on."
        }
      }
    },
    {
      key: "menuPricingFit",
      label: "Menu and Pricing Fit",
      what: "Whether price points and menu structure match what the trade area can and will pay, relative to nearby competitors.",
      bands: {
        strong: {
          meaning: "Pricing and menu structure land right where this market expects and is willing to pay for this category.",
          implication: "You can protect margin without guests feeling overcharged or wondering if you're underpriced for the experience."
        },
        solid: {
          meaning: "Pricing is close to the market's comfort zone, with a few items or tiers worth recalibrating.",
          implication: "Small pricing or menu-structure adjustments could recover margin without hurting perceived value."
        },
        attention: {
          meaning: "Pricing sits noticeably out of step with either what the market pays for this category or what competitors charge.",
          implication: "You're likely leaving margin on the table, or creating a value objection, every day pricing goes unaddressed."
        },
        concern: {
          meaning: "There's a significant mismatch between pricing and what this trade area is used to paying for this category.",
          implication: "This can suppress both trial and repeat visits regardless of food, drink, or service quality — it's a business-model issue, not a menu issue."
        }
      }
    },
    {
      key: "gbpLocalSeo",
      label: "GBP / Local SEO Opportunity",
      what: "How visible and complete the business is on Google Business Profile and in local search compared with nearby competitors.",
      bands: {
        strong: {
          meaning: "The business shows up well and completely where people already search for this category nearby.",
          implication: "A meaningful share of demand is arriving essentially for free, through search rather than paid effort."
        },
        solid: {
          meaning: "Local search visibility is reasonable, with clear, specific gaps versus top-ranking competitors.",
          implication: "Closing those gaps is a relatively low-cost way to capture more of the demand that already exists nearby."
        },
        attention: {
          meaning: "The business is meaningfully underrepresented in local search relative to its competitors.",
          implication: "You're likely paying to attract guests through ads or promotions that competitors are earning for free through search."
        },
        concern: {
          meaning: "The business is largely invisible where nearby guests are actually searching for this category.",
          implication: "This is one of the most fixable, highest-leverage gaps on this scorecard — and one of the most expensive to leave unaddressed."
        }
      }
    },
    {
      key: "reviewSentiment",
      label: "Review Sentiment Opportunity",
      what: "What existing reviews — this business's and its competitors' — reveal about guest experience gaps, reputation risk, and reputation opportunity.",
      bands: {
        strong: {
          meaning: "Review sentiment is a genuine asset, reinforcing trust before a guest ever walks in.",
          implication: "Reviews are actively doing sales work — protecting and amplifying that sentiment should be a standing priority."
        },
        solid: {
          meaning: "Sentiment is generally positive, with a few recurring themes worth addressing directly.",
          implication: "Closing those specific, named gaps could turn good reviews into consistently great ones."
        },
        attention: {
          meaning: "Reviews point to a real, recurring experience gap that's shaping how prospective guests perceive the business before they arrive.",
          implication: "Left unaddressed, this pattern will keep costing conversions from people who read reviews before choosing where to go — which is most people."
        },
        concern: {
          meaning: "Review sentiment is actively working against the business in a category where trust signals heavily influence the first visit.",
          implication: "This can quietly cap growth no matter how strong marketing or the physical location are, because reviews are often the last thing a prospective guest checks."
        }
      }
    },
    {
      key: "differentiation",
      label: "Differentiation Potential",
      what: "How clearly the concept can stand apart from the competitive set in the eyes of the guest, not just on paper.",
      bands: {
        strong: {
          meaning: "The concept has a clear, defensible reason for guests to choose it over the alternatives nearby.",
          implication: "That reason should be the center of the brand story — it's the thing worth repeating everywhere."
        },
        solid: {
          meaning: "There are real points of difference, but they aren't yet the first thing a guest would notice or repeat to a friend.",
          implication: "Sharpening and simplifying the message around the strongest point of difference should pay off quickly."
        },
        attention: {
          meaning: "From a guest's perspective, this concept currently looks similar to several nearby alternatives.",
          implication: "Without a clearer point of difference, guest choice often comes down to convenience or price — a hard place to compete from."
        },
        concern: {
          meaning: "There isn't yet a clear, guest-facing reason this concept stands apart from what's already nearby.",
          implication: "This is frequently the root cause behind soft demand and marketing that underperforms its spend — it's worth solving before spending more to promote an unclear story."
        }
      }
    },
    {
      key: "operationalRisk",
      label: "Operational Risk",
      what: "Exposure from labor market tightness, occupancy costs, regulatory or compliance factors, and other forces that can erode margin regardless of guest demand.",
      bands: {
        strong: {
          meaning: "The operating environment — labor, costs, regulatory conditions — is currently working in the concept's favor.",
          implication: "Margin is more protected here than in most markets, which creates room to invest in guest experience or growth."
        },
        solid: {
          meaning: "Operating conditions are manageable, with one or two specific pressure points worth monitoring.",
          implication: "Naming and planning for those pressure points now is cheaper than reacting to them later."
        },
        attention: {
          meaning: "One or more operating conditions — likely labor availability, occupancy cost, or compliance burden — are creating real pressure.",
          implication: "These pressures tend to show up first as margin erosion, not obviously as a 'sales' problem, which makes them easy to misdiagnose."
        },
        concern: {
          meaning: "The operating environment carries significant, structural risk independent of how well the concept is run day to day.",
          implication: "Even strong sales can be offset by these pressures — this deserves a specific mitigation plan before further investment."
        }
      }
    },
    {
      key: "marketingDifficulty",
      label: "Marketing Difficulty",
      what: "How hard — and how costly — it will realistically be to reach, convince, and convert the right guests in this specific market and category.",
      bands: {
        strong: {
          meaning: "Reaching and converting the right guests here should be comparatively straightforward and efficient.",
          implication: "Marketing dollars are likely to go further here than in a typical market for this category."
        },
        solid: {
          meaning: "Marketing here is workable but will take real, sustained effort to stand out.",
          implication: "A focused strategy will outperform a scattered one — this is not a market where broad, generic marketing pays off."
        },
        attention: {
          meaning: "Cutting through in this market and category will take more effort and budget than average.",
          implication: "Underestimating this cost is a common reason marketing plans stall out before they gain traction."
        },
        concern: {
          meaning: "This market and category combination is a genuinely difficult one to market into cost-effectively.",
          implication: "A conventional marketing approach and budget are unlikely to be sufficient — this calls for a materially different strategy, not just more spend."
        }
      }
    }
  ];

  const OVERALL = {
    key: "overall",
    label: "Overall Concept–Location Fit",
    what: "The roll-up of all eleven categories: how well this specific concept, in this specific location, is positioned to succeed today.",
    bands: {
      strong: {
        meaning: "Concept and location are genuinely working together right now.",
        implication: "This is a strong foundation to build on — the priority now is execution and protecting what's already working."
      },
      solid: {
        meaning: "Concept and location are a reasonable fit, with specific, addressable gaps holding back full performance.",
        implication: "Closing the weakest categories first should produce a noticeably stronger overall position."
      },
      attention: {
        meaning: "There's a real, worth-investigating gap between what this concept needs and what this location currently provides.",
        implication: "Nothing here looks fatal, but the gaps are unlikely to close on their own — they tend to compound the longer they're left unaddressed."
      },
      concern: {
        meaning: "Several material risk areas are stacking up between this concept and this location.",
        implication: "This combination of factors is worth a closer look before committing further time or money — not necessarily a reason to walk away, but a reason to get specific about why, before spending more."
      }
    }
  };

  // --- Demo scoring engine -------------------------------------------------
  // Deterministic hash so the same inputs always return the same demo
  // scorecard (useful for screenshots/testing) without being real analysis.

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededScore(seed, key, low, high) {
    const h = hashString(seed + "::" + key);
    const frac = (h % 1000) / 1000;
    const raw = low + frac * (high - low);
    return Math.round(raw * 2) / 2; // nearest 0.5
  }

  function runDemoScore({ name, concept, location }) {
    const seed = [name, concept, location].map((s) => (s || "").trim().toLowerCase()).join("|");
    const scores = {};
    CATEGORIES.forEach((cat) => {
      scores[cat.key] = seededScore(seed, cat.key, 4.0, 9.0);
    });
    const overallScore = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / CATEGORIES.length) * 2) / 2;
    return { scores, overallScore };
  }

  window.TapAndTableScorecard = {
    CATEGORIES,
    OVERALL,
    STATUS_BANDS,
    statusForScore,
    runDemoScore
  };
})();
