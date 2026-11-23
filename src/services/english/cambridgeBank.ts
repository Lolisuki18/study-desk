export interface CambridgeReadingTest {
  id: string
  source: string
  title: string
  domain: string
  summary: string
  paragraphs: {
    label: string
    textEn: string
    textVi: string
  }[]
  questions: {
    id: string
    type: 'TFNG' | 'MultipleChoice' | 'SummaryCompletion'
    statement: string
    options?: string[]
    correct: string
    explanationVi: string
    locatingSentence: string
    keyVocabulary: { word: string; meaningVi: string }[]
  }[]
  vocabularyTable: { word: string; ipa: string; meaningVi: string }[]
}

export const CAMBRIDGE_READING_TESTS: CambridgeReadingTest[] = [
  {
    id: 'cam18-t1-urban-farming',
    source: 'Cambridge IELTS 18 - Academic Reading Test 1',
    title: 'Urban Agriculture: Cultivating the Future in Modern Megacities',
    domain: 'Agricultural Science & Urban Ecology',
    summary:
      'Nghien cuu ve mo hinh nong nghiep do thi cao tang (Vertical Farming) nham giai quyet van de an ninh luong thuc va giam thieu dau chan carbon.',
    paragraphs: [
      {
        label: 'A',
        textEn:
          'In contemporary metropolitan clusters, vertical hydroponic agriculture is transitioning from an experimental architectural novelty into a viable commercial imperative. With global demographics projected to eclipse nine billion by 2050, traditional open-field arable cultivation is confronting acute geographic limitations. Intensive traditional agriculture accounts for nearly seventy percent of global freshwater withdrawals and precipitates widespread soil depletion through chemical run-off.',
        textVi:
          'Tai cac cum do thi hien dai, nong nghiep thuy canh theo chieu doc dang chuyen minh tu mot y tuong kien truc thu nghiem thanh mot yeu cau thuong mai thiet thuc. Voi dan so toan cau du kien vuot qua 9 ty nguoi vao nam 2050, canh tac dat nong nghiep truyen thong dang doi mat voi nhung gioi han dia ly nghiem ngat...',
      },
      {
        label: 'B',
        textEn:
          'Vertical farms deploy closed-loop recirculating irrigation networks that slash water consumption by up to ninety-five percent compared with conventional farming. Furthermore, because crops are cultivated within strictly controlled ambient environments shielded from adverse climatic perturbations, growers completely eliminate the imperative for synthetic chemical pesticides. LED photosynthetic lighting calibrated to optimal spectral wavelengths accelerates photosynthetic efficiency, enabling continuous year-round harvest cycles.',
        textVi:
          'Cac trang trai thang dung trien khai mang luoi tuoi tieu tuan hoan kin giup cat giam luong nuoc tieu thu toi 95% so voi nong nghiep truyen thong. Hon nua, do cay trong duoc nuoi duong trong moi truong kiem soat nghiem ngat tranh khoi thoi tiet xau, nguoi trong hoan toan loai bo nhu cau dung thuoc tru sau...',
      },
      {
        label: 'C',
        textEn:
          'Nonetheless, detractors underscore the exorbitant capital expenditures required to erect and operate vertical facilities. The astronomical electricity demand incurred by artificial illumination and climate-control chillers remains a critical ecological bottleneck. Unless urban facilities are energized by localized renewable micro-grids, their operational carbon footprint can paradoxically surpass that of traditional logistics networks.',
        textVi:
          'Tuy nhien, nhung nguoi chi trich nhan manh den chi phi von dau tu khong lo de xay dung va van hanh cac co so thang dung. Nhu cau dien nang khong lo tu he thong chieu sang nhan tao va may lam lanh van la mot diem nghen sinh thai dang ke...',
      },
    ],
    questions: [
      {
        id: 'cam18-q1',
        type: 'TFNG',
        statement:
          'Traditional open-field farming consumes a minor percentage of the worldwide freshwater supply.',
        correct: 'FALSE',
        locatingSentence:
          'Intensive traditional agriculture accounts for nearly seventy percent of global freshwater withdrawals.',
        explanationVi:
          'Doan A neu ro: nong nghiep truyen thong chiem toi gan 70% luong nuoc ngot toan cau, do do nhan dinh "consumes a minor percentage" (chiem ty le nho) la hoan toan sai (FALSE).',
        keyVocabulary: [
          { word: 'freshwater withdrawals', meaningVi: 'luong khai thac nuoc ngot' },
          { word: 'minor percentage', meaningVi: 'ty le nho' },
        ],
      },
      {
        id: 'cam18-q2',
        type: 'TFNG',
        statement:
          'Vertical agriculture eradicates the necessity of applying artificial pest control substances.',
        correct: 'TRUE',
        locatingSentence:
          'growers completely eliminate the imperative for synthetic chemical pesticides.',
        explanationVi:
          'Doan B xac nhan: nguoi trong hoan toan loai bo nhu cau su dung thuoc tru sau hoa hoc nhan tao ("completely eliminate the imperative for synthetic chemical pesticides"), trung khop voi nhan dinh (TRUE).',
        keyVocabulary: [
          { word: 'eradicate the necessity', meaningVi: 'loai bo hoan toan su can thiet' },
          { word: 'synthetic chemical pesticides', meaningVi: 'thuoc tru sau hoa hoc tong hop' },
        ],
      },
      {
        id: 'cam18-q3',
        type: 'TFNG',
        statement:
          'The majority of vertical farms worldwide are currently powered by solar panel micro-grids.',
        correct: 'NOT GIVEN',
        locatingSentence:
          'Unless urban facilities are energized by localized renewable micro-grids, their operational carbon footprint can paradoxically surpass...',
        explanationVi:
          'Doan C chi canh bao rang "tru khi cac co so duoc cap dien bang mang luoi tai tao, neu khong...", chu khong co thong tin ve ty le da so cac trang trai hien tai da chay bang nang luong mat troi hay chua (NOT GIVEN).',
        keyVocabulary: [
          { word: 'operational carbon footprint', meaningVi: 'dau chan carbon trong van hanh' },
          { word: 'localized renewable micro-grids', meaningVi: 'luoi dien cuc bo nang luong tai tao' },
        ],
      },
    ],
    vocabularyTable: [
      { word: 'hydroponic', ipa: '/ˌhaɪ.drəˈpɒn.ɪk/', meaningVi: 'phuong phap trong cay thuy canh' },
      { word: 'imperative', ipa: '/ɪmˈper.ə.tɪv/', meaningVi: 'nhu cau cap bach, dieu bat buoc phai lam' },
      { word: 'depletion', ipa: '/dɪˈpliː.ʃən/', meaningVi: 'su can kiet, hao mon' },
      { word: 'photosynthetic', ipa: '/ˌfəʊ.təʊ.sɪnˈθet.ɪk/', meaningVi: 'thuoc ve quang hop' },
      { word: 'exorbitant', ipa: '/ɪɡˈzɔː.bɪ.tənt/', meaningVi: 'qua cao, cat co (ve chi phi)' },
    ],
  },
  {
    id: 'cam19-t2-ancient-languages',
    source: 'Cambridge IELTS 19 - Academic Reading Test 2',
    title: 'Deciphering The Indus Script: Computational Archaeology',
    domain: 'Linguistics & Computational History',
    summary:
      'Giai ma van tu nen van minh song An bang cong nghe may hoc va phan tich tan suat ky tu ma hoa.',
    paragraphs: [
      {
        label: 'A',
        textEn:
          'The enigmatic Indus Valley civilization, flourishing between 2600 and 1900 BCE across modern-day Pakistan and northwest India, left behind thousands of miniature carved steatite seals. Despite over a century of sustained epigraphic scrutiny, the underlying linguistic structure encoded within these pictographic glyphs remains stubbornly unreadable.',
        textVi:
          'Nen van minh song An bi an phat trien ruc ro tu nam 2600 den 1900 TCN da de lai hang nghin con dau bang da khac nho. Mac du da trai qua hon mot the ky nghien cuu van khac lien tuc, cau truc ngon ngu duoc ma hoa ben trong nhung ky tu hinh ve nay van hoan toan chua the doc duoc...',
      },
      {
        label: 'B',
        textEn:
          'Recent breakthroughs in computational linguistics have revitalized the field. By treating inscription sequences as probabilistic Markov chains, researchers measured the entropic conditional probability of sign succession. The resulting statistical patterns demonstrated an intermediate entropy profile identical to known natural spoken languages, debunking previous skeptic claims that the inscriptions were merely decorative clan heraldry.',
        textVi:
          'Nhung dot pha gan day trong ngon ngu hoc tinh toan da hoi sinh linh vuc nay. Bang cach coi cac chuoi van khac nhu cac chuoi xac suat Markov, cac nha nghien cuu da do luong xac suat dieu kien entropy... Ket qua thong ke bac bo nhung tuyen bo hoai nghi truoc day rang cac ky tu chi la hoa tiet trang tri gia toc...',
      },
    ],
    questions: [
      {
        id: 'cam19-q1',
        type: 'TFNG',
        statement:
          'Epigraphers successfully deciphered the full grammatical syntax of the Indus script in the early 20th century.',
        correct: 'FALSE',
        locatingSentence:
          'the underlying linguistic structure encoded within these pictographic glyphs remains stubbornly unreadable.',
        explanationVi:
          'Doan A khang dinh den tan ngay nay cau truc ngon ngu cua van tu song An van chua the giai ma ("remains stubbornly unreadable"), do do nhan dinh da giai ma thanh cong tu dau the ky 20 la sai (FALSE).',
        keyVocabulary: [
          { word: 'epigraphers', meaningVi: 'cac nha nghien cuu van khac co dai' },
          { word: 'stubbornly unreadable', meaningVi: 'van kien quyet khong the doc duoc' },
        ],
      },
      {
        id: 'cam19-q2',
        type: 'TFNG',
        statement:
          'Statistical entropy analysis confirmed that the symbols share characteristics with spoken human languages.',
        correct: 'TRUE',
        locatingSentence:
          'The resulting statistical patterns demonstrated an intermediate entropy profile identical to known natural spoken languages.',
        explanationVi:
          'Doan B xac nhan: phan tich entropy thong ke cho thay mau hinh giong het voi cac ngon ngu noi tu nhien ("identical to known natural spoken languages"), khang dinh nhan dinh la dung (TRUE).',
        keyVocabulary: [
          { word: 'statistical entropy', meaningVi: 'do do entropy thong ke' },
          { word: 'natural spoken languages', meaningVi: 'ngon ngu noi tu nhien' },
        ],
      },
    ],
    vocabularyTable: [
      { word: 'enigmatic', ipa: '/ˌen.ɪɡˈmæt.ɪk/', meaningVi: 'bi an, kho hieu' },
      { word: 'epigraphic', ipa: '/ˌep.ɪˈɡræf.ɪk/', meaningVi: 'thuoc ve van khac co hoc' },
      { word: 'pictographic', ipa: '/ˌpɪk.təˈɡræf.ɪk/', meaningVi: 'chu tuong hinh' },
      { word: 'debunk', ipa: '/diːˈbʌŋk/', meaningVi: 'bac bo mot quan niem sai lam' },
      { word: 'heraldry', ipa: '/ˈher.əl.dri/', meaningVi: 'phu hieu gia toc, huy hieu' },
    ],
  },
]
