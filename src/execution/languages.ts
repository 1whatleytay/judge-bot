export enum Language {
    CPP = 'cpp',
    Java = 'java',
    CSharp = 'cs',
    Python = 'py',
    JavaScript = 'js',
    Go = 'go',
    Rust = 'rust',
    Swift = 'swift',
    Haskell = 'hs'
}

export interface LanguageProperties {
    commonName: string
    emoji: string
    imageName: string

    fileExtensions: string[] // preferred first

    hidden?: boolean
}

export const properties: Record<Language, LanguageProperties> = {
    [Language.CPP]: {
        commonName: 'C/C++',
        emoji: '🇨',

        imageName: 'cpp',

        fileExtensions: [ 'cpp', 'cxx', 'c++', 'c', 'h', 'hpp' ]
    },
    [Language.Java]: {
        commonName: 'Java',
        emoji: '☕',

        imageName: 'java',

        fileExtensions: [ 'java' ]
    },
    [Language.CSharp]: {
        commonName: 'C#',
        emoji: '#️⃣',

        imageName: 'cs',

        fileExtensions: [ 'cs', 'c#' ]
    },
    [Language.Python]: {
        commonName: 'Python',
        emoji: '🐌',

        imageName: 'py',
        
        fileExtensions: [ 'py', 'python' ]
    },
    [Language.JavaScript]: {
        commonName: 'JavaScript',
        emoji: '🇸',

        imageName: 'js',

        fileExtensions: [ 'js' ]
    },
    [Language.Go]: {
        commonName: 'Go',
        emoji: '🇬',

        imageName: 'go',

        fileExtensions: [ 'go' ]
    },
    [Language.Rust]: {
        commonName: 'Rust',
        emoji: '⚙️',

        imageName: 'rust',

        fileExtensions: [ 'rs', 'rust' ]
    },
    [Language.Swift]: {
        commonName: 'Swift',
        emoji: '🐦',

        imageName: 'swift',

        hidden: true,

        fileExtensions: [ 'swift' ]
    },
    [Language.Haskell]: {
        commonName: 'Haskell',
        emoji: '🇭',

        imageName: 'haskell',

        hidden: true,

        fileExtensions: [ 'hs', 'haskell' ]
    }
}

export function toLanguage(text: string): Language | undefined {
    for (const language of Object.keys(properties) as Language[]) {
        const props = properties[language]

        if (props.fileExtensions.includes(text)) {
            return language
        }
    }

    return undefined
}
