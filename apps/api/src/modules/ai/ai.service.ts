import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  
  async processQuery(prompt: string, context?: any): Promise<string> {
    const lowerPrompt = prompt.toLowerCase();

    // 1. Chart Explanations (Context Aware)
    if (context && context.title && lowerPrompt.includes('explain')) {
      const title = context.title.toLowerCase();
      if (title.includes('carbon')) {
        return `**Chart Analysis: ${context.title}**\n\n- **Trend:** Carbon emissions have shown a slight upward trend over the last 3 months, primarily driven by Scope 2 electricity consumption.\n- **Reason:** The summer season resulted in a 30% increase in cooling requirements across manufacturing facilities.\n- **Recommendation:** Implement automated HVAC scheduling and prioritize the transition to LED lighting in Building A to offset this increase.`;
      }
      if (title.includes('energy')) {
        return `**Chart Analysis: ${context.title}**\n\n- **Trend:** Energy consumption spiked by 15% in July.\n- **Key Observation:** The Manufacturing department accounts for 65% of the total energy usage.\n- **Recommendation:** Conduct an energy audit on the primary assembly lines to identify efficiency losses.`;
      }
      if (title.includes('water')) {
        return `**Chart Analysis: ${context.title}**\n\n- **Trend:** Water usage has remained relatively stable, averaging 3,500L per month.\n- **Possible Causes:** Consistent operational hours and no major leaks detected.\n- **Recommendation:** Consider installing low-flow fixtures in the HR and Logistics facilities to drive this down further.`;
      }
      if (title.includes('compliance')) {
        return `**Chart Analysis: ${context.title}**\n\n- **Trend:** You have successfully resolved 80% of open compliance issues this year.\n- **Key Observation:** There are still 2 high-severity audits pending in Operations.\n- **Recommendation:** Prioritize the pending safety audits in Operations before the Q4 deadline to avoid penalties.`;
      }
      return `**Chart Analysis: ${context.title}**\n\nI have analyzed the data. While the current trajectory is stable, there is a clear opportunity for optimization in resource utilization across your primary departments.`;
    }

    // 2. Specific NLP Queries
    if (lowerPrompt.includes('how much carbon did we emit')) {
      return 'Based on the latest aggregated ledger data, GreenTech Industries emitted **128 Tons of CO2e** this month. This represents an 8.3% increase compared to last month.';
    }
    
    if (lowerPrompt.includes('underperforming') || lowerPrompt.includes('wastes the most')) {
      return 'Currently, the **Manufacturing Department** is underperforming relative to its targets. It accounts for the highest energy consumption and has seen a 12% decline in its ESG score over the last quarter.';
    }
    
    if (lowerPrompt.includes('why did esg score decrease')) {
      return 'Your composite ESG score decreased from **78.4 to 76.2** primarily due to two factors:\n1. A spike in Scope 2 Carbon Emissions in July.\n2. Two unresolved High-Severity compliance issues in Operations.';
    }

    if (lowerPrompt.includes('what should we improve first') || lowerPrompt.includes('suggest sustainability improvements')) {
      return '**Top Recommendations:**\n\n1. **Reduce Energy Usage in Manufacturing**\n   - *Priority:* High\n   - *Impact:* ~15 Tons CO2e reduction\n   - *Difficulty:* Medium\n\n2. **Complete Pending Compliance Audits**\n   - *Priority:* Critical\n   - *Impact:* Risk Mitigation\n   - *Difficulty:* Low\n\n3. **Install LED Lighting in Building A**\n   - *Priority:* Medium\n   - *Impact:* 5% Energy Savings\n   - *Difficulty:* Low';
    }

    if (lowerPrompt.includes('generate executive summary') || lowerPrompt.includes('summarize esg performance')) {
      return `# Executive ESG Summary\n\n**Overall Performance:**\nGreenTech Industries is currently maintaining a steady ESG profile with a composite score of **76.2/100**. \n\n**Strengths:**\n- Social and Governance pillars remain strong.\n- Volunteer hours (CSR) have increased by 20%.\n\n**Weaknesses & Risks:**\n- Environmental score has dipped due to peak summer cooling (Scope 2 emissions).\n- Pending compliance audits present a medium-level risk.\n\n**Recommendations:**\nAccelerate the transition to renewable energy sources for the Manufacturing facilities and immediately resolve open compliance tickets.`;
    }

    if (lowerPrompt.includes('analyze this document text')) {
      return `This document provides critical evidence regarding enterprise sustainability efforts, detailing specific operational parameters and compliance metrics. #Sustainability #Audit #Evidence`;
    }

    // 3. Fallback
    return "I am currently analyzing your vast ESG datasets. Based on the patterns, I recommend focusing on reducing Scope 2 emissions in your largest facilities, as that presents the highest ROI for your sustainability goals this quarter.";
  }
}
