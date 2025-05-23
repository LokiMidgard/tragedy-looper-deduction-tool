import 'path';
import fs from 'fs';
import path from 'path';


const types = ['characters', 'scripts', 'plots', 'roles', 'tragedys', 'incidents'] as const;

const dirs = fs.readdirSync('./data');
const data =
    Promise.all(
        dirs.flatMap(folder => types.map(t => [folder, t] as const))
            .map(([folder, type]) => [`./data/${folder}/${type}.json`, type] as const)
            .filter(([x]) => fs.existsSync(x))
            .map(([scriptLocation, type]) => new Promise<readonly [string, typeof types[number]]>((resolve, reject) => {
                fs.readFile(scriptLocation, 'utf-8', (err, data) => {
                    if (err !== null) {
                        reject(err);
                    } else {
                        resolve([data, type] as const);
                    }
                })
            }))
    );



data.then(x => {

    const data = types.map(type => {
        return [type, x.filter(([, t]) => t == type).filter(([x, type]) => {
            try {
                const parsed = JSON.parse(x);
                return (typeof parsed == 'object' && Array.isArray(parsed))
                    || (typeof parsed == 'object' && !Array.isArray(parsed) && Object.keys(parsed).includes(type));
            } catch (error) {
                console.error(error);
                return false;
            }
        }).map(([x, type]) => {
            const parsed = JSON.parse(x);
            if (typeof parsed == 'object' && Array.isArray(parsed)) {
                return x;
            } else {
                return JSON.stringify(parsed[type], undefined, 2);
            }

        })] as const;
    });

    return data.map(([type, arrays]) => {

        return `export const ${type} = [\n${arrays.map(x => ` ...${x}`).reduce((p, c) => `${p}${p.length > 0 ? ',' : ''}\n${c}`, '')}\n] as const`;

    }).reduce((p, c) => `${p};\n${c}`, '')




}
).then(x => {

    fs.writeFileSync('./src/data.ts', x);
    console.log('finished game data')
}
)

// translations


const translationsfiles = fs.readdirSync('./translations');
const translationData =
    Promise.all(
        translationsfiles.map((fileName) => [`./translations/${fileName}`, path.parse(fileName).name] as const)
            .filter(([x]) => fs.existsSync(x))
            .map(([localisationPath, localisationName]) => new Promise<readonly [string, string]>((resolve, reject) => {
                fs.readFile(localisationPath, 'utf-8', (err, data) => {
                    if (err !== null) {
                        reject(err);
                    } else {
                        resolve([data, localisationName] as const);
                    }
                })
            }))
    );



translationData.then((translations) => {

    const innerObject = translations.map(([data, lang]) => {
        return `"${lang}": ${data}`;
    }).reduce((p, c) => `${p}${p.length == 0 ? '' : ','}\n${c}`, "");

    return `export const translations = {\n${innerObject}\n}`
}
).then(x => {

    fs.writeFileSync('./src/data-translations.ts', x);
    console.log('finished Translations');
}
)



// get all ts files in the src folder recursively
const typescriptFiles: string[] = [];
const getAllFiles = (dirPath: string) => {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.svelte')) {
            typescriptFiles.push(filePath);
        }
    });
};
getAllFiles('./src');


const translationStrings: string[] = [];
typescriptFiles.forEach((file) => {
    const fileContent = fs.readFileSync(file, 'utf-8');
    // search for getString('TEXT') and getString('', lang) including other quotes
    const regex = /getString\((\s|\n)*(['"])(.*?[^\\])\2/sg;
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
        const quotes = match[2];
        const text = match[3];
        translationStrings.push(`${quotes}${text}${quotes}`);
    }
});
const translationObject = `export const ui_strings = [\n${translationStrings.reduce((p, c) => `${p}${p.length == 0 ? '' : ','}\n${c}`, "")}\n] as const;`;
fs.writeFileSync('./src/data-ui-strings.ts', translationObject);
