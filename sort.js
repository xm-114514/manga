const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, 'books');
const outputPath = path.join(__dirname, 'books', 'ebooks.json');

const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

async function generateEbooksJson() {
    const ebooks = [];

    const folders = await fs.promises.readdir(booksDir, { withFileTypes: true });
    for (const folder of folders) {
        if (folder.isDirectory()) {
            const folderPath = path.join(booksDir, folder.name);
            const files = await fs.promises.readdir(folderPath);

            const images = files
                .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
                .map(file => path.join(folder.name, file));

            let caption = `N/A`;

            const tagsPath = path.join(folderPath, 'tags.json');
            if (files.includes('tags.json')) {
                try {
                    const tagsData = await fs.promises.readFile(tagsPath, 'utf8');
                    const tags = JSON.parse(tagsData);
                    if (Array.isArray(tags)) {
                        caption = `${tags.join(', ')}`;
                    }
                } catch (error) {
                    console.error(`エラー: ${tagsPath} の読み込みに失敗しました`, error);
                }
            }

            if (images.length > 0) {
                const ebook = {
                    title: folder.name,
                    caption,
                    cover: images[0],  
                    page: images
                };
                ebooks.push(ebook);
            }
        }
    }
    fs.writeFileSync(outputPath, JSON.stringify(ebooks, null, 2), 'utf8');
    console.log(`ebooks.jsonが生成されました: ${outputPath}`);
}

generateEbooksJson().catch(error => console.error("エラー:", error));
