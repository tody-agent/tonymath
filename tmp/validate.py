import json

with open('/Volumes/Data/Kids/hoc-toan-vui/tmp/grade-5-batch-a.json', 'r') as f:
    lessons = json.load(f)

print(f'Total lessons: {len(lessons)}')
print(f'IDs: {[l["id"] for l in lessons]}')
print()

required_fields = ['id','title','shortTitle','icon','color','skill','story','visual','retellOptions','correctRetell','facts','factRoles','models','correctModel','operations','correctOperation','reasons','correctReason','answer','unit','answerOptions','correctAnswerSentence','checkQuestion','checkOptions','correctCheck','hints']

for l in lessons:
    lid = l['id']
    missing = [f for f in required_fields if f not in l]
    if missing:
        print(f'{lid}: MISSING fields: {missing}')
    
    hints_count = len(l.get('hints', []))
    if hints_count < 6 or hints_count > 8:
        print(f'{lid}: HINTS count = {hints_count} (need 6-8)')
    
    answer = l['answer']
    correct_sentence = l['answerOptions'][l['correctAnswerSentence']]
    ans_str = str(answer)
    int_ans_str = str(int(answer)) if answer == int(answer) else None
    found = ans_str in correct_sentence or (int_ans_str and int_ans_str in correct_sentence)
    if not found:
        print(f'{lid}: Answer {answer} NOT in sentence: {correct_sentence}')
    
    op = l['operations'][l['correctOperation']]
    status = 'OK' if found else 'CHECK'
    print(f'{lid}: op="{op}" answer={answer} hints={hints_count} {status}')

print()
print('Validation complete!')
