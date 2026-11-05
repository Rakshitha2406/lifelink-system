with open('static/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Check bracket matching
brackets = {'{': '}', '(': ')', '[': ']'}
stack = []
line_num = 1
col_num = 1
errors = []

for idx, char in enumerate(code):
    if char == '\n':
        line_num += 1
        col_num = 1
        continue
    col_num += 1

    if char in brackets.keys():
        stack.append((char, line_num, col_num))
    elif char in brackets.values():
        if not stack:
            errors.append(f"Unmatched closing '{char}' at line {line_num}:{col_num}")
        else:
            last_open, o_line, o_col = stack.pop()
            if brackets[last_open] != char:
                errors.append(f"Mismatched bracket: opened '{last_open}' at {o_line}:{o_col}, but closed '{char}' at {line_num}:{col_num}")

if stack:
    for op, l, c in stack:
        errors.append(f"Unclosed '{op}' from line {l}:{c}")

print(f"Total lines: {line_num}")
print(f"Total bracket errors: {len(errors)}")
for e in errors[:10]:
    print(" -", e)
