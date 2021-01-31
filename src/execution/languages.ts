export enum Language {
    CPP = 'cpp',
    Java = 'java',
    Python = 'py',
    JavaScript = 'js',
}

export class LanguageProperties {
    commonName: string
    emoji: string
    imagePath: string

    fileExtensions: string[] // preferred first
}

export const properties: Record<Language, LanguageProperties> = {
    [Language.CPP]: {
        commonName: 'C/C++',
        emoji: '🇨',

        imagePath: 'images/cpp',

        fileExtensions: [ 'cpp', 'cxx', 'c++', 'c', 'h', 'hpp' ]
    },
    [Language.Java]: {
        commonName: 'Java',
        emoji: '☕',

        imagePath: 'images/java',

        fileExtensions: [ 'java' ]
    },
    [Language.Python]: {
        commonName: 'Python',
        emoji: '🐌',

        imagePath: 'images/py',
        
        fileExtensions: [ 'py', 'python' ]
    },
    [Language.JavaScript]: {
        commonName: 'JavaScript',
        emoji: '🇸',

        imagePath: 'images/js',

        fileExtensions: [ 'js' ]
    }
}

export function toLanguage(text: string): Language {
    for (const language of Object.keys(properties) as Language[]) {
        const props = properties[language]

        if (props.fileExtensions.includes(text)) {
            return language
        }
    }

    return null
}
