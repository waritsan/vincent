'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'th' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    th: {
        // Navigation
        'nav.benefits': 'สวัสดิการ',
        'nav.services': 'บริการ',
        'nav.yourRights': 'สิทธิของเรา',
        'nav.getHelp': 'ขอความช่วยเหลือ',
        'nav.admin': 'ผู้ดูแลระบบ',
        'nav.myAccount': 'บัญชีของฉัน',
        'nav.searchPlaceholder': 'ค้นหาโพสต์...',
        'nav.news': 'ข่าวสาร',
        'nav.laws': 'กฎหมาย',

        // Hero Section
        'hero.title': 'ช็อตฟีล STORY',
        'hero.subtitle': 'เรื่องราวที่คุณควรรู้',
        'hero.description': 'ค้นพบเรื่องราวที่น่าสนใจที่เราคัดสรรมาเพื่อคุณ',

        // Footer
        'footer.aboutUs': 'เกี่ยวกับเรา',
        'footer.ourMission': 'ภารกิจของเรา',
        'footer.ourTeam': 'ทีมของเรา',
        'footer.careers': 'ร่วมงานกับเรา',
        'footer.yourBenefits': 'สิทธิประโยชน์ของคุณ',
        'footer.healthcare': 'สุขภาพ',
        'footer.education': 'การศึกษา',
        'footer.housing': 'ที่อยู่อาศัย',
        'footer.needHelp': 'ต้องการความช่วยเหลือ?',
        'footer.contactUs': 'ติดต่อเรา',
        'footer.faq': 'คำถามที่พบบ่อย',
        'footer.support': 'สนับสนุน',
        'footer.copyright': '© 2025 The GLOBE. อยู่เคียงข้างคุณ สนับสนุนสิทธิและสวัสดิการของคุณ',

        // AI Chat
        'chat.title': 'ผู้ช่วยของคุณ',
        'chat.statusReady': 'เราพร้อมช่วยเหลือคุณ',
        'chat.statusAvailable': 'ถามเราได้ทุกเรื่อง ทุกเวลา',
        'chat.welcome': 'สวัสดีค่ะ! ฉันพร้อมช่วยคุณทำความเข้าใจสิทธิของคุณ สำรวจสวัสดิการ และหาการสนับสนุนที่คุณต้องการ มาเริ่มกันเลยค่ะ—ฉันยินดีช่วยเหลือตลอดเวลา! 🌟',
        'chat.inputPlaceholder': 'พิมพ์ข้อความของคุณ...',

        // Blog Posts
        'blog.error': 'ไม่สามารถโหลดข้อมูลได้',
        'blog.tryAgain': 'ลองอีกครั้ง',
        'blog.title': 'ข่าวสารใหม่สำหรับคุณ',
        'blog.refresh': 'รีเฟรช',
        'blog.noResults': 'ไม่พบโพสต์',
        'blog.noResultsDesc': 'เราไม่พบโพสต์ที่ตรงกับ',
        'blog.clearSearch': 'ล้างการค้นหาในแถบนำทางเพื่อดูโพสต์ทั้งหมด',
        'blog.emptyState': 'ยังไม่มีข้อมูลในขณะนี้ กรุณาตรวจสอบอีกครั้งในภายหลัง!',
        'blog.filterByTag': 'กรองตามแท็ก',
        'blog.allTags': 'ทั้งหมด',
        'blog.latestNews': 'ข่าวสารล่าสุด',
        'blog.allNews': 'ข่าวสารทั้งหมด',
        'filter.show': 'แสดง',
        'filter.allPosts': 'ข่าวสารทั้งหมด',
        'filter.government': 'หน่วยงานรัฐบาล',
        'filter.filterBy': 'กรองตาม',
        'filter.filteredBy': 'กรองตาม',
        'filter.clearAll': 'ล้างทั้งหมด',
        'filter.all': 'ทั้งหมด',
        'filter.allNews': 'ข่าวสารทั้งหมด',
        'benefits.title': 'สิทธิประโยชน์และสวัสดิการ',
        'benefits.subtitle': 'สิทธิประโยชน์ที่คุณควรรู้',

        // Dashboard
        'dashboard.loading': 'กำลังโหลดแดชบอร์ด...',
        'dashboard.error': 'ข้อผิดพลาด',
        'dashboard.sorryCouldNotGenerateChart': 'ขออภัย ฉันไม่สามารถสร้างกราฟได้ ข้อผิดพลาด',
        'dashboard.title': 'แดชบอร์ดบริษัท',
        'dashboard.subtitle': 'ข้อมูลเชิงลึกจากบริษัทที่ถูกดึงข้อมูล {count} แห่ง',
        'dashboard.totalCompanies': 'จำนวนบริษัททั้งหมด',
        'dashboard.locations': 'สถานที่ตั้ง',
        'dashboard.withValuation': 'มีมูลค่าทรัพย์สิน',
        'dashboard.companyLocationsDistribution': 'การกระจายสถานที่ตั้งบริษัท',
        'dashboard.topCompanyValuations': 'มูลค่าบริษัทสูงสุด ({count} บริษัท)',
        'dashboard.companyLocationsMap': 'แผนที่สถานที่ตั้งบริษัท',
        'dashboard.askForCustomCharts': 'ขอกราฟแบบกำหนดเอง',
        'dashboard.generateChart': 'สร้างกราฟ',
        'dashboard.chartPromptPlaceholder': 'ลอง: "บริษัทในกรุงเทพที่มีมูลค่าเกิน 100 ล้านบาท"',
        'dashboard.chartExamples': 'ตัวอย่าง: "บริษัทในกรุงเทพที่มีมูลค่าเกิน 100 ล้านบาท", "แสดงบริษัท 5 อันดับแรกจากเชียงใหม่", "บริษัทที่มีมูลค่าต่ำกว่า 50 ล้านที่สร้างในปีนี้", "แผนภูมิวงกลมของสถานที่ตั้ง"',
        'dashboard.aiAnalysis': 'การวิเคราะห์ AI:',
        'dashboard.location': 'สถานที่ตั้ง',
        'dashboard.valuation': 'มูลค่าทรัพย์สิน',

        // BI Dashboard
        'bi.title': 'แดชบอร์ดข่าวสารธุรกิจ',
        'bi.subtitle': 'การวิเคราะห์ขั้นสูงและการแสดงภาพเมตริกสำหรับการขุดข้อมูลข่าวสารภาครัฐ',
        'bi.refresh': 'รีเฟรช',
        'bi.export': 'ส่งออก',
        'bi.lastUpdated': 'อัปเดตล่าสุด',
        'bi.views': 'มุมมอง BI',
        'bi.overview': 'ภาพรวม',
        'bi.metricsDistribution': 'การกระจายเมตริก',
        'bi.primaryMetrics': 'เมตริกหลัก',
        'bi.operationalMetrics': 'เมตริกการดำเนินงาน',
        'bi.aiMetadata': 'ข้อมูลเมตา AI',
        'bi.sentimentAnalysis': 'การวิเคราะห์ความรู้สึก',
        'bi.riskAnalysis': 'การวิเคราะห์ความเสี่ยง',
        'bi.comparativeAnalysis': 'การวิเคราะห์เปรียบเทียบ',
        'bi.metricsCoverageOverview': 'ภาพรวมการครอบคลุมเมตริก',
        'bi.topicDistribution': 'การกระจายหัวข้อ',
        'bi.trendingTopicsPerformance': 'ประสิทธิภาพหัวข้อยอดนิยม',
        'bi.primaryMetricsBreakdown': 'การแบ่งเมตริกหลัก',
        'bi.clickToFilter': 'คลิกที่แถบใดก็ได้เพื่อกรองบทความตามหมวดหมู่',
        'bi.articlesWithPrimaryMetrics': 'บทความที่มีเมตริกหลัก',
        'bi.filteredBy': 'กรองตาม',
        'bi.clearFilter': 'ล้างตัวกรอง',
        'bi.noArticlesFound': 'ไม่พบบทความสำหรับหมวดหมู่ที่เลือก',
        'bi.tryDifferentCategory': 'ลองเลือกหมวดหมู่ที่แตกต่างหรือล้างตัวกรอง',
        'bi.viewArticle': 'ดูบทความ',
        'bi.articleDetails': 'รายละเอียดบทความ',
        'bi.articleId': 'ID บทความ',
        'bi.analyzedAt': 'วิเคราะห์เมื่อ',
        'bi.extractedKeyMetrics': 'ข้อมูลสำคัญที่สกัดได้',
        'bi.originalArticleContent': 'เนื้อหาบทความต้นฉบับ',
        'bi.readFullArticle': 'อ่านบทความเต็ม',
        'bi.noArticleUrl': 'ไม่มี URL บทความ',
        'bi.primaryCategory': 'หมวดหมู่หลัก',
        'bi.confidence': 'ความเชื่อมั่น',
        'bi.operationalMetricsBreakdown': 'การแบ่งเมตริกการดำเนินงาน',
        'bi.aiMetadataInsightsBreakdown': 'การแบ่งข้อมูลเชิงลึกข้อมูลเมตา AI',
        'bi.articlesWithInsights': 'บทความที่มีข้อมูลเชิงลึก',
        'bi.mediaSentimentDistribution': 'การกระจายความรู้สึกสื่อ',
        'bi.sentiment': 'ความรู้สึก',
        'bi.articles': 'บทความ',
        'bi.riskAnalysisDashboard': 'แดชบอร์ดการวิเคราะห์ความเสี่ยง',
        'bi.riskCategoriesOverview': 'ภาพรวมหมวดหมู่ความเสี่ยง',
        'bi.identifiedRisks': 'ความเสี่ยงที่ระบุ',
        'bi.comparativeMetricsAnalysis': 'การวิเคราะห์เมตริกเปรียบเทียบ',
        'bi.metricsCoverageComparison': 'การเปรียบเทียบการครอบคลุมเมตริก',
        'bi.primaryVsOperationalMetrics': 'เมตริกหลักเทียบกับเมตริกการดำเนินงาน',
        'bi.performanceInsights': 'ข้อมูลเชิงลึกประสิทธิภาพ',
        'bi.primaryMetricsCoverage': 'การครอบคลุมเมตริกหลัก',
        'bi.operationalMetricsCoverage': 'การครอบคลุมเมตริกการดำเนินงาน',
        'bi.aiMetadataCoverage': 'การครอบคลุมข้อมูลเมตา AI',
        'bi.policyProjectsIdentified': 'โครงการนโยบายที่ระบุ',
        'bi.articlesAnalyzed': 'บทความที่วิเคราะห์แล้ว',
        'bi.data': 'ข้อมูล',
        'bi.totalArticlesAnalyzed': 'บทความทั้งหมดที่วิเคราะห์',
        'bi.filters': 'ตัวกรอง',
        'bi.allCategories': 'หมวดหมู่ทั้งหมด',
        'bi.allSentiments': 'ความรู้สึกทั้งหมด',
        'bi.positive': 'เชิงบวก',
        'bi.negative': 'เชิงลบ',
        'bi.neutral': 'เป็นกลาง',
        'bi.last7Days': '7 วันที่ผ่านมา',
        'bi.last30Days': '30 วันที่ผ่านมา',
        'bi.last90Days': '90 วันที่ผ่านมา',
        'bi.lastYear': 'ปีที่แล้ว',

        // BI Dashboard Categories and Metrics
        'bi.category.economicGrowth': 'การเติบโตทางเศรษฐกิจและความสามารถในการแข่งขัน',
        'bi.category.humanResource': 'การพัฒนาทรัพยากรมนุษย์',
        'bi.category.socialWelfare': 'สวัสดิการสังคมและการลดความไม่เท่าเทียม',
        'bi.category.healthSecurity': 'ความมั่นคงด้านสุขภาพและสาธารณสุข',
        'bi.category.environmentalSecurity': 'ความมั่นคงด้านอาหาร พลังงาน และสิ่งแวดล้อม',
        'bi.category.governance': 'การบริหารราชการแผ่นดินและธรรมาภิบาล',

        // Metric Labels
        'bi.metric.gdpGrowth': 'GDP Growth',
        'bi.metric.fdi': 'FDI',
        'bi.metric.keyExports': 'key exports',
        'bi.metric.newsSignals': 'news signals',
        'bi.metric.pisaScores': 'PISA Scores',
        'bi.metric.stemGraduates': 'STEM Graduates',
        'bi.metric.reskillingPrograms': 'reskilling programs',
        'bi.metric.unemployment': 'Unemployment',
        'bi.metric.giniCoefficient': 'Gini Coefficient',
        'bi.metric.householdDebt': 'Household Debt/GDP',
        'bi.metric.povertyRate': 'Poverty Rate',
        'bi.metric.inflationRate': 'Inflation Rate',
        'bi.metric.hospitalsUpgraded': 'Hospitals Upgraded',
        'bi.metric.healthcareCoverage': 'Healthcare Coverage',
        'bi.metric.bedsPopulation': 'Beds/Population',
        'bi.metric.vaccinationCoverage': 'Vaccination Coverage',
        'bi.metric.healthSignals': 'health signals',
        'bi.metric.renewableEnergy': 'Renewable Energy',
        'bi.metric.carbonReduction': 'Carbon Reduction',
        'bi.metric.pm25Levels': 'PM2.5 Levels',
        'bi.metric.recyclingRate': 'Recycling Rate',
        'bi.metric.eGovCoverage': 'E-Gov Coverage',
        'bi.metric.openDataPortals': 'Open Data Portals',
        'bi.metric.corruptionIndex': 'Corruption Index',
        'bi.metric.governanceSignals': 'governance signals',
        'bi.metric.articlesWithData': 'Articles with data',
        'bi.metric.articlesWithInsights': 'Articles with insights',
        'bi.metric.articles': 'Articles',
        'bi.metric.identifiedRisks': 'Identified risks',

        // Modal Labels
        'bi.modal.gdpGrowthRate': 'GDP Growth Rate',
        'bi.modal.laborProductivity': 'Labor Productivity',
        'bi.modal.exportValue': 'Export Value',
        'bi.modal.keySectorExports': 'Key Sector Exports',
        'bi.modal.literacyRate': 'Literacy Rate',
        'bi.modal.averageWageGrowth': 'Average Wage Growth',
        'bi.modal.socialSecurityCoverage': 'Social Security Coverage',
        'bi.modal.universalHealthcare': 'Universal Healthcare',
        'bi.modal.newHospitalConstruction': 'New Hospital Construction',
        'bi.modal.bedsPerPopulation': 'Beds per Population',
        'bi.modal.telemedicineImplementation': 'Telemedicine Implementation',
        'bi.modal.renewableEnergyTargets': 'Renewable Energy Targets',
        'bi.modal.waterResourceIndex': 'Water Resource Index',
        'bi.modal.foodSecurityIndex': 'Food Security Index',
        'bi.modal.digitalServiceUtilization': 'Digital Service Utilization',
        'bi.modal.govCloudMigration': 'Gov Cloud Migration',
        'bi.modal.digitalTransformationInitiatives': 'Digital Transformation Initiatives',
        'bi.modal.antiCorruptionMeasures': 'Anti-Corruption Measures',

        // Dynamic Chart Generation
        'bi.askForCustomCharts': 'ขอกราฟแบบกำหนดเอง',
        'bi.generateChart': 'สร้างกราฟ',
        'bi.chartPromptPlaceholder': 'ลอง: "แสดงบทความเกี่ยวกับเศรษฐกิจในกรุงเทพ"',
        'bi.chartExamples': 'ตัวอย่าง: "แสดงบทความเกี่ยวกับเศรษฐกิจในกรุงเทพ", "แผนภูมิวงกลมของหมวดหมู่หลัก", "บทความที่มีความเชื่อมั่นสูงกว่า 80%", "การกระจายความรู้สึกสื่อ"',
        'bi.aiAnalysis': 'การวิเคราะห์ AI:',
        'bi.sorryCouldNotGenerateChart': 'ขออภัย ฉันไม่สามารถสร้างกราฟได้ ข้อผิดพลาด',
    },
    en: {
        // Navigation
        'nav.benefits': 'Benefits',
        'nav.services': 'Services',
        'nav.yourRights': 'Your Rights',
        'nav.getHelp': 'Get Help',
        'nav.admin': 'Admin',
        'nav.myAccount': 'My Account',
        'nav.searchPlaceholder': 'Search posts...',
        'nav.news': 'News',
        'nav.laws': 'Laws',

        // Hero Section
        'hero.title': 'SHOTFEEL STORY',
        'hero.subtitle': 'Stories You Should Know',
        'hero.description': 'Discover the stories curated just for you that will make you feel empowered.',

        // Footer
        'footer.aboutUs': 'About Us',
        'footer.ourMission': 'Our Mission',
        'footer.ourTeam': 'Our Team',
        'footer.careers': 'Careers',
        'footer.yourBenefits': 'Your Benefits',
        'footer.healthcare': 'Healthcare',
        'footer.education': 'Education',
        'footer.housing': 'Housing',
        'footer.needHelp': 'Need Help?',
        'footer.contactUs': 'Contact Us',
        'footer.faq': 'FAQ',
        'footer.support': 'Support',
        'footer.copyright': '© 2025 The GLOBE. Standing by you, supporting your rights and benefits.',

        // AI Chat
        'chat.title': 'Your Support Assistant',
        'chat.statusReady': 'We\'re here for you',
        'chat.statusAvailable': 'Ask us anything, anytime',
        'chat.welcome': 'Hi there! I\'m here to help you understand your rights, explore your benefits, and find the support you need. Let\'s get started—I\'m ready to assist you every step of the way! 🌟',
        'chat.inputPlaceholder': 'Type your message...',

        // Blog Posts
        'blog.error': 'We couldn\'t load the updates',
        'blog.tryAgain': 'Try Again',
        'blog.title': 'What\'s New For You',
        'blog.refresh': 'Refresh',
        'blog.noResults': 'No Posts Found',
        'blog.noResultsDesc': 'We couldn\'t find any posts matching',
        'blog.clearSearch': 'Clear your search in the navigation bar to see all posts.',
        'blog.emptyState': 'No updates available right now. Please check back later!',
        'blog.filterByTag': 'Filter by tag',
        'blog.allTags': 'All',
        'blog.latestNews': 'Latest News',
        'blog.allNews': 'All News',
        'filter.show': 'Show',
        'filter.allPosts': 'All Posts',
        'filter.government': 'Government Agencies',
        'filter.filterBy': 'Filter by',
        'filter.filteredBy': 'Filtered by',
        'filter.clearAll': 'Clear All',
        'filter.all': 'All',
        'filter.allNews': 'All News',
        'benefits.title': 'Benefits & Welfare',
        'benefits.subtitle': 'Benefits You Should Know',

        // Dashboard
        'dashboard.loading': 'Loading dashboard...',
        'dashboard.error': 'Error',
        'dashboard.sorryCouldNotGenerateChart': 'Sorry, I couldn\'t generate that chart. Error',
        'dashboard.title': 'Company Dashboard',
        'dashboard.subtitle': 'Insights from {count} extracted companies',
        'dashboard.totalCompanies': 'Total Companies',
        'dashboard.locations': 'Locations',
        'dashboard.withValuation': 'With Valuation',
        'dashboard.companyLocationsDistribution': 'Company Locations Distribution',
        'dashboard.topCompanyValuations': 'Top Company Valuations ({count} companies)',
        'dashboard.companyLocationsMap': 'Company Locations Map',
        'dashboard.askForCustomCharts': 'Ask for Custom Charts',
        'dashboard.generateChart': 'Generate Chart',
        'dashboard.chartPromptPlaceholder': 'Try: "companies in Bangkok with valuations over 100 million baht"',
        'dashboard.chartExamples': 'Examples: "companies in Bangkok with valuations over 100 million baht", "show top 5 companies from Chiang Mai", "companies under 50 million created this year", "pie chart of locations"',
        'dashboard.aiAnalysis': 'AI Analysis:',
        'dashboard.location': 'Location',
        'dashboard.valuation': 'Valuation',

        // BI Dashboard
        'bi.title': 'Business Intelligence Dashboard',
        'bi.subtitle': 'Advanced analytics and metrics visualization for government news data mining',
        'bi.refresh': 'Refresh',
        'bi.export': 'Export',
        'bi.lastUpdated': 'Last updated',
        'bi.views': 'BI Views',
        'bi.overview': 'Overview',
        'bi.metricsDistribution': 'Metrics Distribution',
        'bi.primaryMetrics': 'Primary Metrics',
        'bi.operationalMetrics': 'Operational Metrics',
        'bi.aiMetadata': 'AI Metadata',
        'bi.sentimentAnalysis': 'Sentiment Analysis',
        'bi.riskAnalysis': 'Risk Analysis',
        'bi.comparativeAnalysis': 'Comparative Analysis',
        'bi.metricsCoverageOverview': 'Metrics Coverage Overview',
        'bi.topicDistribution': 'Topic Distribution',
        'bi.trendingTopicsPerformance': 'Trending Topics Performance',
        'bi.primaryMetricsBreakdown': 'Primary Metrics Breakdown',
        'bi.clickToFilter': 'Click on any bar to filter articles by category',
        'bi.articlesWithPrimaryMetrics': 'Articles with Primary Metrics',
        'bi.filteredBy': 'Filtered by',
        'bi.clearFilter': 'Clear Filter',
        'bi.noArticlesFound': 'No articles found for the selected category',
        'bi.tryDifferentCategory': 'Try selecting a different category or clearing the filter',
        'bi.viewArticle': 'View Article',
        'bi.articleDetails': 'Article Details',
        'bi.articleId': 'Article ID',
        'bi.analyzedAt': 'Analyzed at',
        'bi.extractedKeyMetrics': 'Extracted Key Metrics',
        'bi.originalArticleContent': 'Original Article Content',
        'bi.readFullArticle': 'Read Full Article',
        'bi.noArticleUrl': 'No Article URL',
        'bi.primaryCategory': 'Primary Category',
        'bi.confidence': 'Confidence',
        'bi.operationalMetricsBreakdown': 'Operational Metrics Breakdown',
        'bi.aiMetadataInsightsBreakdown': 'AI Metadata Insights Breakdown',
        'bi.articlesWithInsights': 'Articles with insights',
        'bi.mediaSentimentDistribution': 'Media Sentiment Distribution',
        'bi.sentiment': 'Sentiment',
        'bi.articles': 'Articles',
        'bi.riskAnalysisDashboard': 'Risk Analysis Dashboard',
        'bi.riskCategoriesOverview': 'Risk Categories Overview',
        'bi.identifiedRisks': 'Identified risks',
        'bi.comparativeMetricsAnalysis': 'Comparative Metrics Analysis',
        'bi.metricsCoverageComparison': 'Metrics Coverage Comparison',
        'bi.primaryVsOperationalMetrics': 'Primary vs Operational Metrics',
        'bi.performanceInsights': 'Performance Insights',
        'bi.primaryMetricsCoverage': 'Primary Metrics Coverage',
        'bi.operationalMetricsCoverage': 'Operational Metrics Coverage',
        'bi.aiMetadataCoverage': 'AI Metadata Coverage',
        'bi.policyProjectsIdentified': 'Policy Projects Identified',
        'bi.articlesAnalyzed': 'Articles analyzed',
        'bi.data': 'Data',
        'bi.totalArticlesAnalyzed': 'Total Articles Analyzed',
        'bi.filters': 'Filters',
        'bi.allCategories': 'All Categories',
        'bi.allSentiments': 'All Sentiments',
        'bi.positive': 'Positive',
        'bi.negative': 'Negative',
        'bi.neutral': 'Neutral',
        'bi.last7Days': 'Last 7 days',
        'bi.last30Days': 'Last 30 days',
        'bi.last90Days': 'Last 90 days',
        'bi.lastYear': 'Last year',

        // BI Dashboard Categories and Metrics
        'bi.category.economicGrowth': 'Economic Growth & Competitiveness',
        'bi.category.humanResource': 'Human Resource Development',
        'bi.category.socialWelfare': 'Social Welfare & Inequality Reduction',
        'bi.category.healthSecurity': 'Health Security & Public Health',
        'bi.category.environmentalSecurity': 'Food, Energy & Environmental Security',
        'bi.category.governance': 'Public Administration & Governance',

        // Metric Labels
        'bi.metric.gdpGrowth': 'GDP Growth',
        'bi.metric.fdi': 'FDI',
        'bi.metric.keyExports': 'key exports',
        'bi.metric.newsSignals': 'news signals',
        'bi.metric.pisaScores': 'PISA Scores',
        'bi.metric.stemGraduates': 'STEM Graduates',
        'bi.metric.reskillingPrograms': 'reskilling programs',
        'bi.metric.unemployment': 'Unemployment',
        'bi.metric.giniCoefficient': 'Gini Coefficient',
        'bi.metric.householdDebt': 'Household Debt/GDP',
        'bi.metric.povertyRate': 'Poverty Rate',
        'bi.metric.inflationRate': 'Inflation Rate',
        'bi.metric.hospitalsUpgraded': 'Hospitals Upgraded',
        'bi.metric.healthcareCoverage': 'Healthcare Coverage',
        'bi.metric.bedsPopulation': 'Beds/Population',
        'bi.metric.vaccinationCoverage': 'Vaccination Coverage',
        'bi.metric.healthSignals': 'health signals',
        'bi.metric.renewableEnergy': 'Renewable Energy',
        'bi.metric.carbonReduction': 'Carbon Reduction',
        'bi.metric.pm25Levels': 'PM2.5 Levels',
        'bi.metric.recyclingRate': 'Recycling Rate',
        'bi.metric.eGovCoverage': 'E-Gov Coverage',
        'bi.metric.openDataPortals': 'Open Data Portals',
        'bi.metric.corruptionIndex': 'Corruption Index',
        'bi.metric.governanceSignals': 'governance signals',
        'bi.metric.articlesWithData': 'Articles with data',
        'bi.metric.articlesWithInsights': 'Articles with insights',
        'bi.metric.articles': 'Articles',
        'bi.metric.identifiedRisks': 'Identified risks',

        // Modal Labels
        'bi.modal.gdpGrowthRate': 'GDP Growth Rate',
        'bi.modal.laborProductivity': 'Labor Productivity',
        'bi.modal.exportValue': 'Export Value',
        'bi.modal.keySectorExports': 'Key Sector Exports',
        'bi.modal.literacyRate': 'Literacy Rate',
        'bi.modal.averageWageGrowth': 'Average Wage Growth',
        'bi.modal.socialSecurityCoverage': 'Social Security Coverage',
        'bi.modal.universalHealthcare': 'Universal Healthcare',
        'bi.modal.newHospitalConstruction': 'New Hospital Construction',
        'bi.modal.bedsPerPopulation': 'Beds per Population',
        'bi.modal.telemedicineImplementation': 'Telemedicine Implementation',
        'bi.modal.renewableEnergyTargets': 'Renewable Energy Targets',
        'bi.modal.waterResourceIndex': 'Water Resource Index',
        'bi.modal.foodSecurityIndex': 'Food Security Index',
        'bi.modal.digitalServiceUtilization': 'Digital Service Utilization',
        'bi.modal.govCloudMigration': 'Gov Cloud Migration',
        'bi.modal.digitalTransformationInitiatives': 'Digital Transformation Initiatives',
        'bi.modal.antiCorruptionMeasures': 'Anti-Corruption Measures',

        // Dynamic Chart Generation
        'bi.askForCustomCharts': 'Ask for Custom Charts',
        'bi.generateChart': 'Generate Chart',
        'bi.chartPromptPlaceholder': 'Try: "show articles about economy in Bangkok"',
        'bi.chartExamples': 'Examples: "show articles about economy in Bangkok", "pie chart of primary categories", "articles with confidence over 80%", "media sentiment distribution"',
        'bi.aiAnalysis': 'AI Analysis:',
        'bi.sorryCouldNotGenerateChart': 'Sorry, I couldn\'t generate that chart. Error',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('th');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load language from localStorage on mount, default to Thai
        const savedLang = localStorage.getItem('language') as Language | null;
        if (savedLang && (savedLang === 'th' || savedLang === 'en')) {
            setLanguageState(savedLang);
        } else {
            // Set Thai as default if no saved preference
            setLanguageState('th');
            localStorage.setItem('language', 'th');
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            // Update document lang attribute
            document.documentElement.lang = language;
            // Save to localStorage
            localStorage.setItem('language', language);
        }
    }, [language, mounted]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
