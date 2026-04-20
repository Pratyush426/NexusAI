const Groq = require("groq-sdk");
require("dotenv").config();

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.extractBasicFields = async (email = {}) => {
    try {
        const body = email.body || "";
        const subject = email.subject || "";
        const from = email.from || "";

        // If no content, return unknown early
        if (!body && !subject) {
            return {
                appliedFrom: "unknown",
                companyName: "unknown",
                jobRole: "unknown",
                status: "unknown",
                confidence: 0,
                date: null
            };
        }

        const prompt = `
        You are an intelligent data extraction assistant for a job tracking application.
        Analyze the following email content and extract structured data.
        
        Email source: "${from}"
        Subject: "${subject}"
        Body snippet: "${body.substring(0, 3000)}"

        Tasks:
        1. Identify the **Company Name** (the employer). 
           - If sent from a company domain (e.g., @novalabs.tech), usage that company name.
           - If from a recruitment agency (e.g., naukri.com), find the client company name.
        2. Identify the **Job Role/Title**.
           - Look for phrases like "applying for [Role]", "position of [Role]", "role: [Role]".
           - Check the **Subject Line** carefully (e.g., "Application for [Role]").
           - **CRITICAL**: If the email is clearly about a job application/process but **no specific role** is mentioned, return "**General Application**" instead of "unknown".
        3. Identify the **Application Platform**.
           - If sent from a job board (LinkedIn, Indeed, Naukri, Monster, Wellfound), use that name.
           - **CRITICAL**: If the email is directly from the company's HR/Recruiting team (e.g., peopleops@novalabs.tech) and NOT a job board, set appliedFrom to "**Company Website**" or "**Direct**". Do NOT return "unknown" for direct emails.
        4. Determine the **Application Status**. 
           - **Applied**: Application received/submitted using words like "received your application", "thanks for applying".
           - **Shortlisted**: "Next steps", "Shortlisted", "profile aligns well", "next phase of evaluation", "move forward".
           - **Interview**: "Interview", "Schedule a call", "Assessment".
           - **Rejected**: "Not selected", "Unfortunately", "Regret".
           - **Offer**: "Offer", "Hired".
           - **Spam**: Marketing, Promotions.
        
        Output strictly valid JSON with this format:
        {
          "companyName": "extracted company or 'unknown'",
          "jobRole": "extracted role or 'unknown'",
          "appliedFrom": "extracted platform (e.g. LinkedIn, Company Website) or 'unknown'",
          "status": "one of [Applied, Shortlisted, Interview, Rejected, Offer, Spam, Other]", 
          "confidence": 0.9 (estimate estimate 0-1)
        }
        
        Do not add markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        let completion;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0,
                    response_format: { type: "json_object" }
                });
                break; // Success, exit loop
            } catch (err) {
                attempts++;
                console.warn(`Groq extraction attempt ${attempts} failed:`, err.message);
                if (attempts >= maxAttempts) throw err; // Throw on final failure
                // Wait 1s, 2s...
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
            }
        }

        const text = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(text);

        let finalAppliedFrom = parsed.appliedFrom || "unknown";
        const finalCompany = parsed.companyName || "unknown";

        // Heuristic: Standardize source to company.com for job boards or unknown sources
        const genericPlatforms = ["linkedin", "indeed", "naukri", "monster", "wellfound", "glassdoor", "unknown", "instahyre", "foundit"];
        const isGeneric = genericPlatforms.some(p => finalAppliedFrom.toLowerCase().includes(p));

        if (isGeneric && finalCompany !== "unknown") {
            const cleanCompany = finalCompany.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            if (cleanCompany) {
                finalAppliedFrom = `${cleanCompany}.com`;
            }
        }

        return {
            appliedFrom: finalAppliedFrom,
            companyName: finalCompany,
            jobRole: parsed.jobRole || "unknown",
            status: (parsed.status || "active").toLowerCase(),
            confidence: parsed.confidence || 0.8,
            date: null
        };

    } catch (error) {
        console.error("Groq Extraction Failed (Switching to Regex Fallback):", error.message);
        return extractBasicFieldsRegex(email);
    }
};

// ---------------------------------------------------------
// FALLBACK REGEX EXTRACTOR (IMPROVED CLEANUP + STATUS)
// ---------------------------------------------------------
function extractBasicFieldsRegex(email = {}) {
    const body = (email.body || "");
    const subject = (email.subject || "");
    const from = (email.from || "");

    const text = (subject + " " + body)
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const rawText = subject + " " + body;

    // 1. APPLIED VIA
    const platformPatterns = [
        { name: "linkedin", patterns: ["linkedin.com", "linkedin.in", "jobs-noreply@linkedin", "job-alerts@linkedin", "talent@linkedin"] },
        { name: "naukri", patterns: ["naukri.com", "naukrirecruiter", "apply@im.jobs"] },
        { name: "indeed", patterns: ["indeedmail", "indeed.com", "no-reply@indeed"] },
        { name: "foundit", patterns: ["foundit", "monsterindia", "monster.com"] },
        { name: "workday", patterns: [".workday.com"] },
        { name: "greenhouse", patterns: [".greenhouse.io"] },
        { name: "lever", patterns: [".lever.co"] },
        { name: "icims", patterns: [".icims.com"] },
        { name: "company website", patterns: ["career@", "careers@", "jobs@", "apply@"] }
    ];

    let applied_via = "unknown";
    for (const p of platformPatterns) {
        for (const patt of p.patterns) {
            if (from.toLowerCase().includes(patt) || text.includes(patt)) {
                applied_via = p.name;
                break;
            }
        }
        if (applied_via !== "unknown") break;
    }
    if (applied_via === "unknown") applied_via = "company website";

    // 2. COMPANY NAME
    let company = "unknown";

    function clean(name = "") {
        // Stop at common sentence words if greedy regex matched too much
        const stopWords = [" has ", " have ", " is ", " was ", " will ", " posted ", " sent ", " received "];
        for (const word of stopWords) {
            if (name.includes(word)) {
                name = name.split(word)[0];
            }
        }
        // Remove punctuation usage often caught by lazy regex
        return name
            .replace(/[,.!?;:]/g, " ") // remove punctuation
            .replace(/[^a-zA-Z0-9 .&()'-]/g, " ")
            .replace(/\b(dear|hello|hi|thanks|regards|sincerely)\b/gi, "")
            .replace(/\b(team|hr|support|careers?|noreply|position|profile|soon|applicant|application|talent|recruitment|recruiter|hiring|jobs?)\b/gi, "")
            .replace(/\s{2,}/g, " ")
            .trim();
    }

    const strongPatterns = [
        /\bapplying to ([A-Za-z0-9 &().'-]{1,80})/gi,
        /\bapplying at ([A-Za-z0-9 &().'-]{1,80})/gi,
        /\bapplied to ([A-Za-z0-9 &().'-]{1,80})/gi,
        /\bapplied at ([A-Za-z0-9 &().'-]{1,80})/gi,
        /\bapplication (?:submitted|received) (?:to|at) ([A-Za-z0-9 &().'-]{1,80})/gi,
        /\bon behalf of ([A-Za-z0-9 &().'-]{2,80})/gi,
        /\bsubmitted via ([A-Za-z0-9 &().'-]{2,80})/gi,
        /\bsubmitted through ([A-Za-z0-9 &().'-]{2,80})/gi,
        /\bfrom ([A-Z][A-Za-z0-9 &().'-]{2,80})/g,
    ];

    for (let r of strongPatterns) {
        let m = r.exec(rawText);
        if (m) { company = clean(m[1]); break; }
    }

    // Medium Patterns
    if (company === "unknown") {
        const mediumPatterns = [
            /\bfrom ([A-Za-z0-9 &().'-]{2,80})(?=[.,\n\s]|$)/gi,
            /\bat ([A-Za-z0-9 &().'-]{2,80})(?=[.,\n\s]|$)/gi, // Greedy source
            /\bwith ([A-Za-z0-9 &().'-]{2,80})(?=[.,\n\s]|$)/gi,
            /\bby ([A-Za-z0-9 &().'-]{2,80})(?=[.,\n\s]|$)/gi,
            /\bopening at ([A-Za-z0-9 &().'-]{2,80})/gi,
            /\bposition at ([A-Za-z0-9 &().'-]{2,80})/gi,
            /\bopportunity at ([A-Za-z0-9 &().'-]{2,80})/gi
        ];
        for (let r of mediumPatterns) {
            let m = r.exec(rawText);
            if (m) {
                // Check if match seems like a sentence (contains verb)
                const potential = clean(m[1]);
                if (potential.length > 2 && potential.split(" ").length < 6) { // Heuristic: Company name rarely > 5 words
                    company = potential;
                    break;
                }
            }
        }
    }

    // 3. JOB ROLE
    let job_role = "unknown";

    function cleanRole(name) {
        return name.replace(/\s{2,}/g, " ").trim();
    }

    // Expanded Strong Role Patterns
    const strongRolePatterns = [
        /\bposition of ([A-Za-z0-9 /&().,'-]{2,80})/i,
        /\brole of ([A-Za-z0-9 /&().,'-]{2,80})/i,
        /\bfor the position of ([A-Za-z0-9 /&().,'-]{2,80})/i,
        /\bapplying for ([A-Za-z0-9 /&().,'-]{2,80})/i,
        /\bapplication for (?:a|an )?([A-Za-z0-9 /&().,'-]{2,80})/i,
        /\bjob title[: ]+([A-Za-z0-9 /&().,'-]{2,80})/i,
        /\bshortlisted for (?:the )?([A-Za-z0-9 /&().,'-]{2,80})/i
    ];

    for (let r of strongRolePatterns) {
        r.lastIndex = 0;
        const m = r.exec(rawText);
        if (m) {
            let rawRole = m[1];
            // If "Software Engineer at Google", split "at"
            let splitAt = rawRole.split(/\b at \b/i);
            if (splitAt.length > 1) {
                rawRole = splitAt[0];
            }
            job_role = cleanRole(rawRole).split(/[\s,.-]+/).slice(0, 5).join(" "); // increased word limit slightly
            break;
        }
    }

    // If role is still unknown, try subj
    if (job_role === "unknown") {
        const subjParams = [/Application Status – (.+)/i];
        for (let r of subjParams) {
            const m = r.exec(subject);
            if (m && m[1].toLowerCase() !== "shortlisted") {
                job_role = cleanRole(m[1]);
            }
        }
    }

    // 4. STATUS (FALLBACK)
    let status = "applied"; // default
    const statusRules = [
        { label: "spam", keywords: ["register now", "click here", "invoice", "payment", "otp", "promo"] },
        { label: "applied", keywords: ["application received", "thanks for applying", "successfully applied"] },
        { label: "selected", keywords: ["you have been selected", "offer extended", "welcome to the team"] },
        { label: "shortlisted", keywords: ["shortlisted", "moved forward", "next stage", "next phase", "aligns well", "further evaluation"] }, // Added "next phase" etc
        { label: "interview", keywords: ["interview", "call", "assessment test"] },
        { label: "rejected", keywords: ["regret to inform", "not selected", "unfortunately"] }
    ];

    for (let rule of statusRules) {
        for (let k of rule.keywords) {
            if (text.includes(k)) {
                status = rule.label;
                break;
            }
        }
        if (status !== "applied") break;
    }

    return {
        appliedFrom: applied_via,
        companyName: company,
        companyNameFallback: company,
        jobRole: job_role,
        status: status,
        confidence: 0.6, // regex is lower confidence
        date: null
    };
}
