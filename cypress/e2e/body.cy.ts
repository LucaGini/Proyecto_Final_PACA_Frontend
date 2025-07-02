describe('E2E BodyComponent', () => {
    beforeEach(() => {
      cy.visit('/'); // Visita la página principal de la aplicación
    });
  
    it('Should load all products from the database', () => {
      cy.get('.products-container').should('be.visible');
      cy.get('#product').should('have.length.greaterThan', 0); // Verifica que haya productos
    });
  
    it('Should display product details when clicked', () => {
        // Selecciona el primer producto de la lista
        cy.get('.products-container .card').first().within(() => {
          cy.get('h1.card-title').should('exist'); 
          cy.get('h3.card-text').should('exist');  
          cy.get('h2.card-text').should('exist');  
          cy.get('.btn-warning').click();  // ESTE ES EL BOTON DE VER EL PRODUCTO "Ver producto"
        });
      

        cy.url().should('match', /\/product\/[a-f0-9]{24}$/); // ACA VERIFICA EL TEMA DE LA URL CUADO APRETAMOS PARA VER SOLO UN PRODUCTO /product/{productId}"
      
        cy.get('.card-img-top').should('exist'); 
        cy.get('.card-title').should('exist');   
        cy.get('.card-text').should('exist');   
        cy.get('h2.card-text').should('contain', 'Precio:');  
      
        cy.get('#Añadir').should('exist');  
      });
  });
  