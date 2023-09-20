import {common, Injector, Logger} from 'replugged';

const injector = new Injector();
const logger = Logger.plugin("Extra Indent Plugin");

function fixIndent(message: string): string {
	let lines = message.split('\n');
	const first_line = lines[0].startsWith('```') ? lines[1] : lines[0];

	// Using a tokenizer because regex is slow.
	let indent_pattern: Array<string> = [];

	for(let char of first_line) {
		if(char != ' ' && char != '\t')
			break;
		indent_pattern.push(char);
	}
	if(indent_pattern.length == 0) // No edits required
		return message;
	logger.log(`Found indents: ${indent_pattern}`)
	let pattern = indent_pattern.join('');
	for(let index in lines) {
		lines[index] = lines[index].replace(pattern, '');
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
