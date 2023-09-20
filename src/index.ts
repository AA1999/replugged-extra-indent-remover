import { common, Injector, Logger } from 'replugged';

const injector = new Injector();
const logger = Logger.plugin('Extra Indent Plugin');

function find_occurrences(message: Array<string>): Array<number> {
	let occurrences: Array<number> = [];
	message.forEach((line, index) => {
		if (line.startsWith('```')) occurrences.push(index);
	});
	return occurrences;
}

function fixIndent(message: string): string {
	let lines = message.split('\n');
	let occurrences = find_occurrences(lines);

	logger.log(occurrences);

	if (occurrences.length % 2 == 1)
		// Extra ```
		occurrences.pop();

	for (let i = 0; i < occurrences.length; i += 2) {
		let startIndex = occurrences[i] + 1;
		let endIndex = occurrences[i + 1];
		const first_line = lines[startIndex];

		// Using a tokenizer because regex is slow.
		let indent_pattern = [];

		for (let char of first_line) {
			if (char != ' ' && char != '\t') break;
			indent_pattern.push(char);
		}

		if (indent_pattern.length == 0) continue; // No edits required for this one.
		let pattern = indent_pattern.join('');
		for (let index = startIndex; index < endIndex; ++index) {
			logger.log(lines[index]);
			lines[index] = lines[index].replace(pattern, '');
		}
	}
	return lines.join('\n');
}

function patchIndent() {
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
	patchIndent();
}

export function stop(): void {
	injector.uninjectAll();
}
