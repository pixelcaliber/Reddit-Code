import * as vscode from 'vscode';
import axios from 'axios';

const predefinedSubreddits = [
    'programming',
    'technology',
    'science',
    'dataisbeautiful',
    'webdev',
    'MachineLearning',
    'ArtificialInteligence',
    'cybersecurity',
    'devops',
    'gamedev',
    'learnprogramming',
    'coding',
    'compsci',
    'javascript',
    'Python',
    'rust',
    'golang',
    'cpp',
    'java',
    'csharp',
    'reactjs',
    'node',
    'angular',
    'vuejs',
    'aws',
    'Azure',
    'GoogleCloud',
    'docker',
    'kubernetes',
    'linux',
    'vim',
    'emacs',
    'vscode',
    'git',
    'github',
    'opensource',
    'webdesign',
    'UI_Design',
    'UXDesign',
    'FrontEndDevelopment',
    'Backend',
    'fullstack',
    'dataengineering',
    'database',
    'sql',
    'nosql',
    'IoT',
    'robotics',
    'cryptocurrencies',
    'startups', 
    'worldnews', 
    'AskReddit'
];

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('reddit-code.showSubreddit', async () => {

        const shuffled = predefinedSubreddits.sort(() => 0.5 - Math.random());
        let pickedSubReddits = shuffled.slice(0, 15);

        const options = ['Enter custom subreddit', ...pickedSubReddits];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select a subreddit or enter a custom one'
        });

        let subreddit: string | undefined;

        if (selected === 'Enter custom subreddit') {
            subreddit = await vscode.window.showInputBox({ prompt: 'Enter subreddit name' });
        } else {
            subreddit = selected;
        }

        if (subreddit) {
            const panel = vscode.window.createWebviewPanel(
                'subredditPanel',
                `Reddit: ${subreddit}`,
                vscode.ViewColumn.One,
                {}
            );
            panel.webview.html = 'Fetching subreddits for ' + subreddit + "...";
            try {
                const articles = await fetchTopArticles(subreddit);
                if (articles && articles.length === 0) {
                    panel.webview.html = 'No stories found for subreddit ' + subreddit + ". Please try a different subreddit.";
                    return;
                }
                panel.webview.html = getWebviewContent(articles, subreddit);
            } catch (error) {
                console.log("Failed to fetch articles", error);
                panel.webview.html = 'Failed to fetch news.';
                vscode.window.showErrorMessage('Failed to fetch news');
            }
        }
    });

    context.subscriptions.push(disposable);
}

async function fetchTopArticles(subreddit: string) {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/top.json?limit=20`);
    if (response.data.data.children.length === 0) {
        return [];
    }
    const articles = await Promise.all(response.data.data.children.map(async (post: any) => {
        let description = post.data.selftext;
        if (!description || description.length === 0) {
            let content = await extractContentSnippet(post.data.url);
            if (content && content?.length > 0) {
                description = content;
            }
        }
        let createdDate = new Date(post.data.created * 1000);
        let thumbnail = (post.data.thumbnail && post.data.thumbnail.length > 0) ? 
                    post.data.thumbnail : 'https://freelogopng.com/images/all_img/1658834095reddit-logo-png.png';
        return {
            title: post.data.title,
            description: description,
            url: post.data.url,
            thumbnail: thumbnail,
            ups: post.data.ups,
            created: createdDate
        };
    }));
    return articles;
}
async function extractContentSnippet(url: string): Promise<string | undefined> {
    try {
        const response = await axios.get(url);
        const htmlContent = response.data;
        const snippet = parseContentSnippet(htmlContent);
        return snippet;
    } catch (error) {
        console.error('Error extracting content snippet:', error);
        return undefined;
    }
}
function parseContentSnippet(htmlContent: string): string | undefined {
    const match = htmlContent.match(/<p>(.*?)<\/p>/);
    if (match) {
        return match[1];
    }
    return undefined;
}
function getWebviewContent(articles: {
    title: string,
    description: string,
    url: string,
    thumbnail: string,
    created: number,
    ups: number
}[], subreddit: string): string {
    const articlesHtml = articles.map(article => {

        return `
        <li class="article-item">
          <img src="${article.thumbnail}" alt="Preview Image" />
          <div class="article-info">
            <h2>${article.title}</h2>
            <p class="description">${article.description}</p>
            <div class="article-meta">
              <p class="metadata">Ups: ${article.ups}</p>
              <p class="metadata">${article.created.toLocaleString()}</p>
            </div>
            <a href="${article.url}" target="_blank">Read more</a>
          </div>
        </li>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reddit Top Articles </title>
        <style>
          body {
            font-family: Ubuntu, sans-serif;
            line-height: 1.2;
            padding: 20px;
            background-color: #f0f0f0;
            color: #000; /* Black text color */
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
            font-size: 1.5rem;
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          .article-item {
            position: relative;
            display: flex;
            margin-bottom: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .article-item img {
            width: 120px;
            height: 120px;
            object-fit: cover;
            margin-left:8px;
            margin-top:8px;
            margin-bottom:8px;
            border-radius: 5px 0 0 5px;
          }
          .article-info {
            flex: 1;
            padding: 15px;
          }
          h2 {
            font-size: 1rem;
            margin-bottom: 10px;
          }
          .description {
            margin-bottom: 10px;
          }
          .article-meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 10px;
            color: #666;
            font-size: 0.9rem;
            position: absolute;
            bottom: 10px;
            right: 10px;
          }
          .metadata {
            margin-right: 10px;
          }
          a {
            color: #007acc;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>Top Articles for r/${subreddit}</h1>
        <ul>${articlesHtml}</ul>
      </body>
      </html>
    `;
}
