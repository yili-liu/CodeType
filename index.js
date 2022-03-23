#!/usr/bin/env node

// ---------- imports ---------- 
import readline from 'readline';
import chalk from 'chalk';
import terminalOverwrite from 'terminal-overwrite';

// ---------- consts ---------- 
const log = console.log;
const pendingColour = chalk.yellow;
const correctColour = chalk.green;
const incorrectColour = chalk.red;
const currentColour = chalk.underline.yellow;

// ---------- init ---------- 
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// ---------- functions ---------- 

function stripLeadingNewlines(text) {
    // remove leading newlines and maybe whitespaces
    let lastNewline = -1;
    for (let i = 0; i < text.length; i++) {
        if (text.charAt(i) === '\n') {
            lastNewline = i;
        } else if (text.charAt(i) !== ' '  &&
                   text.charAt(i) !== '\t') {
            return text.substring(lastNewline + 1);
        }
    }
    return text;
}

function stripTrailingWhitespaces(text) {
    // remove trailing newlines
    let i = text.length - 1;
    while (text.charAt(i) === '\n' || 
           text.charAt(i) === ' ' || 
           text.charAt(i) === '\t') {
        i--;
    }
    return text.substring(0, i + 1);
}

function stripWhitespacesBeforeNewlines(text) {
    for (let i = text.length - 1; i >= 0; i--) {
        if (text.charAt(i) !== '\n')
            continue;
        let newlineIndex = i;
        while (text.charAt(i - 1) === ' ' || text.charAt(i - 1) === '\t')
            i--;
        text = text.substring(0, i) + 
               text.substring(newlineIndex, text.length);
    }
    return text;
}

function cleanPassage(passage) {
    // ensure passage does not start with \n chars
    passage = stripLeadingNewlines(passage);
    // ensure passage does not end with \n chars or whitespaces
    passage = stripTrailingWhitespaces(passage);
    // ensure no whitespaces right before newlines
    passage = stripWhitespacesBeforeNewlines(passage);
    return passage;
}

function computeAdjacency(passage, firstChar) {
    let adj = {};
    for (let i = firstChar; i < passage.length; i++) {
        if (passage.charAt(i) === '\n') {
            let newlineChar = i;
            i++;
            while (passage.charAt(i) === ' ' ||
                   passage.charAt(i) === '\t')
                i++;

            if (!adj[newlineChar]) 
                adj[newlineChar] = {};
            if (!adj[i]) 
                adj[i] = {};
            adj[newlineChar]['nextChar'] = i;
            adj[i]['prevChar'] = newlineChar;
        } 
    }
    return adj;
}

function typePassage(passage) {
    passage = cleanPassage(passage);

    // keep track of current and last correct character indices,
    // and if user is on newline to bypass leading whitespaces
    let curChar = 0;
    let lastCorrectChar = 0;
    let left = [];

    // skip leading whitespaces
    while (passage.charAt(curChar) === ' ' ||
        passage.charAt(curChar) === '\t') {
        curChar++;
        lastCorrectChar = curChar;
    }
    let firstChar = curChar;

    let adj = computeAdjacency(passage, firstChar);
    // log(adj);

    // output initial passage to type
    terminalOverwrite(
        correctColour(passage.substring(0, lastCorrectChar)) + 
        incorrectColour(passage.substring(lastCorrectChar, curChar)) + 
        currentColour(passage.substring(curChar, curChar + 1)) + 
        pendingColour(passage.substring(curChar + 1, passage.length))
    );

    // detect key presses
    // TODO: make sure process starts after previous ends?
    process.stdin.on('keypress', (str, key) => {
        // log(key);

        if (key.name === 'c' && key.ctrl) { // ctrl-c - exit
            log('Cancelled');
            process.exit();
        } else if (key.name === 'backspace') { // backspace - delete last char
            if (adj[curChar] && adj[curChar]['prevChar']) {
                curChar = adj[curChar]['prevChar'];
            } else {
                curChar = Math.max(curChar - 1, firstChar); 
            }
            lastCorrectChar = Math.min(lastCorrectChar, curChar);
        } else {
            if (lastCorrectChar === curChar) {
                if (key.name === 'return' && 
                    passage.charAt(curChar) === '\n') { // enter - newline
                    lastCorrectChar++;
                } else if (str === passage.charAt(curChar)) { // any other key
                    lastCorrectChar++;
                }
            }

            // TODO: should wrong chars at end of line go to next line?
            // if (passage.charAt(curChar) !== '\n') {
            if (adj[curChar] && adj[curChar]['nextChar']) {
                if (lastCorrectChar == curChar + 1) 
                    lastCorrectChar = adj[curChar]['nextChar'];
                curChar = adj[curChar]['nextChar'];
            } else {
                curChar = Math.min(curChar + 1, passage.length);
            }
        }

        // display progress of passage
        // TODO: is concatenation too slow?
        terminalOverwrite(
            correctColour(passage.substring(0, lastCorrectChar)) + 
            incorrectColour(passage.substring(lastCorrectChar, curChar)) + 
            currentColour(passage.substring(curChar, curChar + 1)) + 
            pendingColour(passage.substring(curChar + 1, passage.length))
        );

        // exit if entire passage is typed correctly
        if (lastCorrectChar === passage.length) {
            log('Complete');
            log('TODO: log wpm');
            process.exit();
        }
    });
}

//let test = '   \n\n\t\n \t\n   \ntesting  \n\n\t \n';
//let test = 'test';
//let test = '   testing\n\t test';
let test = '   \n\n\t\n \t\n   testing  \n\n\t testing\n'; // this case fails
// let trailingSpacesTabs = 'for {   \n\tSystem.out.println(i);\n}';
// let leadingSpacesTabs = 'for {\n    System.out.println(i);\n\t}';
typePassage('\n\n\n\n for i \n  print(1)  \t\nyes');

