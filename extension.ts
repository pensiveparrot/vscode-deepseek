import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {


	let disposable = vscode.commands.registerCommand('deepkeek', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepkeek',
			'Deepkeek',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'submit':
						try {
							const completion = await ollama.chat({
								model: 'deepseek-r1:8b',
								messages: [{ role: 'user', content: message.text }]
							});

							panel.webview.postMessage({
								command: 'output',
								text: completion.message.content
							});
						} catch (error: any) {
							vscode.window.showErrorMessage('Error: ' + error.message);
						}
						break;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deepkeek</title>
            <style>
                body {
                    padding: 20px;
                }
                textarea {
                    margin-bottom: 10px;
                }
                #output {
                    margin-top: 20px;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>Deepkeek</h1>
            <textarea id="input" style="width: 100%; height: 200px;"></textarea>
            <button id="submit">Submit</button>
            <div id="output"></div>
            <script>
                const vscode = acquireVsCodeApi();
                const input = document.getElementById('input');
                const submit = document.getElementById('submit');
                const output = document.getElementById('output');

                submit.addEventListener('click', () => {
                    const text = input.value;
                    output.textContent = 'Loading...';
                    vscode.postMessage({
                        command: 'submit',
                        text: text
                    });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'output') {
                        output.textContent = message.text;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

export function deactivate() { }