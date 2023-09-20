import { Injector, Logger, common } from 'replugged';

const injector = new Injector();
const logger = Logger.plugin('Extra Indent Plugin');

function findOccurrences(message: string[]): number[] {
	let occurrences: number[] = [];
	message.forEach((line, index) => {
		if (line.startsWith('```')) occurrences.push(index);
	});
	return occurrences;
}

function fixIndent(message: string): string {
	let lines = message.split('\n');
	let occurrences = findOccurrences(lines);

	logger.log(occurrences);

	if (occurrences.length % 2 == 1)
		// Extra ```
		occurrences.pop();

	for (let i = 0; i < occurrences.length; i += 2) {
		let startIndex = occurrences[i] + 1;
		let endIndex = occurrences[i + 1];
		const firstLine = lines[startIndex];

		// Using a tokenizer because regex is slow.
		let indentPattern = [];

		for (let char of firstLine) {
			if (char != ' ' && char != '\t') break;
			indentPattern.push(char);
		}

		if (indentPattern.length == 0) continue; // No edits required for this one.
		let pattern = indentPattern.join('');
		for (let index = startIndex; index < endIndex; ++index) {
			lines[index] = lines[index].replace(pattern, '');
		}
	}
	logger.log('Fixed the indents!');
	return lines.join('\n');
}

async function patchIndent(): Promise<void> {
	injector.before(common.messages, 'sendMessage', (args) => {
		args[1].content = fixIndent(args[1].content);
		return args;
	});
	injector.before(common.messages, 'editMessage', (args) => {
		args[2].content = fixIndent(args[2].content);
		return args;
	});
}

export async function start(): Promise<void> {
	await patchIndent();
}

export function stop(): void {
	injector.uninjectAll();
}
