export enum Language {
    CPP = 'cpp',
    Java = 'java',
    Python = 'py',
    JavaScript = 'js',
}

export interface LanguageProperties {
    commonName: string
    emoji: string
    imageName: string

    fileExtensions: string[] // preferred first
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
